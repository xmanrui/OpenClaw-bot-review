import {
  appendCommandAudit,
  appendCouncilItems,
  buildCouncilItemsFromUsageWithModel,
  commandError,
  commandOk,
  findSessionFile,
  getCommandConfig,
  IDEA_LEDGER_PATH,
  readCouncilItems,
  readJsonFile,
  localOperatorDeniedPayload,
  upsertLedgerProposed,
  validateCommandRequest,
  validateLocalOperatorRequest,
} from "@/lib/self-improvement-data.mjs";

export type SelfImprovementCommandId = "proactive-real" | "ingest-usage" | "dry-run" | "weekly-review";

type CommandBody = {
  confirm?: boolean;
  timestamp?: string;
};

async function readBody(request: Request): Promise<CommandBody> {
  try {
    return (await request.json()) as CommandBody;
  } catch {
    return {};
  }
}

function sessionContext() {
  const sessionPath = findSessionFile();
  const sessionData = sessionPath ? readJsonFile(sessionPath, { messages: [] }) : { messages: [] };
  const sessionMessages = Array.isArray(sessionData?.messages) ? sessionData.messages.length : 0;
  return { sessionPath, sessionData, sessionMessages };
}

function itemSummary(items: any[]) {
  return items.map((item) => `• ${item.title} (${item.council_confidence ?? "unknown"})`);
}

export async function runSelfImprovementCommand(commandId: SelfImprovementCommandId, request: Request) {
  const localValidation = validateLocalOperatorRequest(request);
  if (!localValidation.ok) {
    return Response.json(localOperatorDeniedPayload(localValidation.reason), { status: localValidation.status ?? 403 });
  }

  const body = await readBody(request);
  const validation = validateCommandRequest(commandId, body);
  if (!validation.ok) {
    const payload = commandError({
      commandId,
      code: validation.confirmationRequired ? "CONFIRMATION_REQUIRED" : "UNKNOWN_COMMAND",
      message: validation.message,
      details: validation,
      status: validation.status,
    });
    return Response.json(payload, { status: validation.status });
  }

  const command = getCommandConfig(commandId)!;
  const startedAt = new Date().toISOString();

  try {
    const { sessionPath, sessionData, sessionMessages } = sessionContext();
    let responsePayload: any;

    if (commandId === "dry-run") {
      const generation = await buildCouncilItemsFromUsageWithModel(sessionData);
      const previewItems = generation.items;
      responsePayload = commandOk({
        command,
        message: `Dry run generated ${previewItems.length} improvement item${previewItems.length === 1 ? "" : "s"} via ${generation.mode}; no files were changed.`,
        output: [
          `DRY RUN ONLY — no writes performed`,
          `Generation mode: ${generation.mode}${generation.model ? ` (model: ${generation.model})` : ""}`,
          generation.reason ? `Note: ${generation.reason}` : null,
          `Source: ${sessionPath ?? "no session file found"}`,
          `Session entries inspected: ${sessionMessages}`,
          `Items previewed: ${previewItems.length}`,
          ...itemSummary(previewItems),
        ].filter((line): line is string => Boolean(line)),
        details: {
          mode: "dry-run",
          generation_mode: generation.mode,
          model: generation.model,
          generation_reason: generation.reason,
          source: sessionPath,
          session_messages: sessionMessages,
          items: previewItems,
        },
      });
    } else if (commandId === "weekly-review") {
      const councilItems = readCouncilItems();
      const ledger = readJsonFile(IDEA_LEDGER_PATH, { proposed: [], adopted: [], rejected: [], dormant: [] });
      responsePayload = commandOk({
        command,
        message: `Weekly review complete: ${councilItems.length} council items, ${(ledger.proposed ?? []).length} proposed ideas.`,
        output: [
          `Council items: ${councilItems.length}`,
          `Ledger proposed: ${(ledger.proposed ?? []).length}`,
          `Ledger adopted: ${(ledger.adopted ?? []).length}`,
          `Ledger rejected: ${(ledger.rejected ?? []).length}`,
          `Ledger dormant: ${(ledger.dormant ?? []).length}`,
          ...itemSummary(councilItems.slice(0, 8)),
        ],
        details: {
          council_total: councilItems.length,
          ledger_counts: {
            proposed: (ledger.proposed ?? []).length,
            adopted: (ledger.adopted ?? []).length,
            rejected: (ledger.rejected ?? []).length,
            dormant: (ledger.dormant ?? []).length,
          },
        },
      });
    } else {
      const generation = await buildCouncilItemsFromUsageWithModel(sessionData);
      const items = generation.items;
      const allItems = appendCouncilItems(items);
      upsertLedgerProposed(items);
      responsePayload = commandOk({
        command,
        message: `${command.label} complete: ${items.length} item${items.length === 1 ? "" : "s"} processed via ${generation.mode}, ${allItems.length} stored total.`,
        output: [
          `Generation mode: ${generation.mode}${generation.model ? ` (model: ${generation.model})` : ""}`,
          generation.reason ? `Note: ${generation.reason}` : null,
          `Source: ${sessionPath ?? "no session file found"}`,
          `Session entries inspected: ${sessionMessages}`,
          `Items processed: ${items.length}`,
          `Stored council total: ${allItems.length}`,
          `Ledger updated: yes`,
          ...itemSummary(items),
        ].filter((line): line is string => Boolean(line)),
        details: {
          generation_mode: generation.mode,
          model: generation.model,
          generation_reason: generation.reason,
          source: sessionPath,
          session_messages: sessionMessages,
          items,
          stored_total: allItems.length,
          writes: ["rd-council-items.json", "idea_ledger.json"],
        },
      });
    }

    appendCommandAudit({
      command_id: commandId,
      command_label: command.label,
      success: true,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      message: responsePayload.message,
      details: responsePayload.details,
    });

    return Response.json(responsePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown command failure";
    const payload = commandError({ commandId, message });
    appendCommandAudit({
      command_id: commandId,
      command_label: command.label,
      success: false,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      message,
    });
    return Response.json(payload, { status: 500 });
  }
}
