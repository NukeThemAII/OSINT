export function inferEventType(text: string): string {
  const lower = text.toLowerCase();
  if (/(missile|rocket)/.test(lower)) return 'missile';
  if (/(drone|uav)/.test(lower)) return 'drone';
  if (/(airstrike|air strike|strike)/.test(lower)) return 'airstrike';
  if (/(naval|tanker|ship|vessel)/.test(lower)) return 'naval_incident';
  if (/(sanction|export control)/.test(lower)) return 'sanctions';
  if (/(aid|humanitarian|displacement|casualt)/.test(lower)) return 'humanitarian_update';
  if (/(fire|hotspot|blaze)/.test(lower)) return 'fire_hotspot';
  return 'conflict';
}

export function inferTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags = new Set<string>();
  const checks: Array<[RegExp, string]> = [
    [/(hormuz)/, 'hormuz'],
    [/(red sea)/, 'red-sea'],
    [/(shipping|ship|vessel|tanker)/, 'shipping'],
    [/(oil|crude|refinery|terminal)/, 'oil'],
    [/(airspace|airport|airfield)/, 'airspace'],
    [/(port|harbor)/, 'port'],
    [/(sanction)/, 'sanctions'],
  ];

  for (const [pattern, tag] of checks) {
    if (pattern.test(lower)) tags.add(tag);
  }

  return Array.from(tags);
}
