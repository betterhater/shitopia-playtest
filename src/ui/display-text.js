// Render-only normalization. Leave raw source and internal > comparisons intact.
import {catalog} from '../data/catalog.js';
export function normalizeDisplayText(value){let output=String(value??'').replace(/^[\t ]*[>＞]+[\t ]*/gm,'');for(const [before,after]of Object.entries(catalog.displayCorrections||{}))output=output.replaceAll(before,after);return output;}
