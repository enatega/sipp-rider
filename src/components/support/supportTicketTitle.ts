export function supportTicketTitle(title: string): string {
  const cleaned = title.replace(/_/g, ' ').replace(/^(store|rider) support\s*-\s*/i, '').trim();
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : title;
}
