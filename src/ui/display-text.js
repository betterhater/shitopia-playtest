// Render-only normalization. Leave raw source and internal > comparisons intact.
export function normalizeDisplayText(value){return String(value??'').replace(/^[\t ]*[>＞]+[\t ]*/gm,'');}
