const META_PREFIX = "[J4Y_META]";

export function buildTeaNotes(paymentStatus, customerNotes = "") {
  const cleanNotes = String(customerNotes || "").trim();
  const header = `${META_PREFIX} payment_status=${paymentStatus}`;
  return cleanNotes ? `${header}\n${cleanNotes}` : header;
}

export function parseTeaNotes(rawNotes) {
  const text = String(rawNotes || "");
  const lines = text.split(/\r?\n/);
  const firstLine = lines[0] || "";

  if (!firstLine.startsWith(META_PREFIX)) {
    return {
      paymentStatus: null,
      customerNotes: text.trim(),
    };
  }

  const match = firstLine.match(/payment_status=([a-z_]+)/i);
  return {
    paymentStatus: match?.[1] || null,
    customerNotes: lines.slice(1).join("\n").trim(),
  };
}

export function updateTeaNotesPaymentStatus(rawNotes, paymentStatus) {
  const { customerNotes } = parseTeaNotes(rawNotes);
  return buildTeaNotes(paymentStatus, customerNotes);
}
