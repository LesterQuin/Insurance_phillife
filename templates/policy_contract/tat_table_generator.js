import { DEFAULT_TAT_ITEMS } from '../../models/ebam_api/contract_tat.model.js';

/**
 * Generates dynamic SLA / TAT table HTML for policy contracts.
 * @param {Array} tatItems - List of TAT items (custom or default)
 * @param {Object} options - Custom style options if needed
 * @returns {string} HTML string
 */
export function generateTatTableHtml(tatItems = null, options = {}) {
    const items = (Array.isArray(tatItems) && tatItems.length > 0) ? tatItems : DEFAULT_TAT_ITEMS;
    const categoryHeaderBg = options.categoryHeaderBg || '#ffff00';

    // Group items by category in order of occurrence
    const categoriesMap = new Map();
    items.forEach(item => {
        const cat = (item.category || 'GENERAL').trim().toUpperCase();
        if (!categoriesMap.has(cat)) {
            categoriesMap.set(cat, []);
        }
        categoriesMap.get(cat).push(item);
    });

    let tbodyRows = '';

    for (const [category, catItems] of categoriesMap.entries()) {
        tbodyRows += `
            <tr style="background-color: ${categoryHeaderBg}; font-weight: bold; font-size: 7.5pt; page-break-after: avoid; break-after: avoid;">
                <td colspan="6" style="border: 1px solid #000; padding: 2px 4px; text-transform: uppercase;">${category}</td>
            </tr>
        `;

        let i = 0;
        while (i < catItems.length) {
            const currentActivity = (catItems[i].activity || '').trim();
            let span = 1;
            while (i + span < catItems.length && (catItems[i + span].activity || '').trim().toUpperCase() === currentActivity.toUpperCase()) {
                span++;
            }

            for (let j = 0; j < span; j++) {
                const item = catItems[i + j];
                const tatVal = item.tat !== undefined && item.tat !== null ? String(item.tat) : '';
                const reckoningDate = item.reckoning_date || '-';
                const mode = item.mode_of_communication || '';
                const responsible = item.responsible || '';
                const contact = item.contact_details || '';

                tbodyRows += '<tr style="page-break-inside: avoid; break-inside: avoid;">';
                if (j === 0) {
                    const rowspanAttr = span > 1 ? ` rowspan="${span}" style="border: 1px solid #000; padding: 2px 3.5px; font-style: italic; vertical-align: middle;"` : ` style="border: 1px solid #000; padding: 2px 3.5px; font-style: italic;"`;
                    const formattedActivity = (item.activity || '').replace(/\n/g, '<br>');
                    tbodyRows += `<td${rowspanAttr}>${formattedActivity}</td>`;
                }

                tbodyRows += `
                    <td style="border: 1px solid #000; padding: 2px 3.5px; text-align: center; font-style: italic;">${tatVal}</td>
                    <td style="border: 1px solid #000; padding: 2px 3.5px; text-align: center; font-style: italic;">${reckoningDate}</td>
                    <td style="border: 1px solid #000; padding: 2px 3.5px; text-align: center; font-style: italic;">${mode}</td>
                    <td style="border: 1px solid #000; padding: 2px 3.5px; text-align: center; font-style: italic;">${responsible}</td>
                    <td style="border: 1px solid #000; padding: 2px 3.5px; text-align: center; font-style: italic;">${contact}</td>
                </tr>`;
            }

            i += span;
        }
    }

    return `
        <div class="sla-container" style="page-break-inside: avoid; break-inside: avoid;">
            <div style="text-align: center; font-size: 8.5pt; font-weight: bold; background-color: #ffffff; color: #000000; text-transform: uppercase; padding: 4px; border-bottom: 1px solid #000; letter-spacing: 0.5px;">TURN-AROUND TIME (TAT)</div>
            <div style="text-align: left; padding: 3px 6px; border-bottom: 1px solid #000; background-color: #ffffff; font-size: 8pt; font-weight: bold; text-transform: uppercase;">
                SERVICE LEVEL AGREEMENT (SLA):
            </div>
            <table class="sla-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000; table-layout: fixed;">
                <thead>
                    <tr style="background-color: #d1d5db; font-size: 7pt; font-weight: bold; text-align: center; border: 1px solid #000;">
                        <th style="width: 24%; border: 1px solid #000; padding: 3px 2px;">TRANSACTION CATEGORY</th>
                        <th style="width: 5%; border: 1px solid #000; padding: 3px 2px;">TAT (WD)</th>
                        <th style="width: 21%; border: 1px solid #000; padding: 3px 2px;">RECKONING DATE</th>
                        <th style="width: 17%; border: 1px solid #000; padding: 3px 2px;">MODE OF COMMUNICATION</th>
                        <th style="width: 15%; border: 1px solid #000; padding: 3px 2px;">RESPONSIBLE</th>
                        <th style="width: 18%; border: 1px solid #000; padding: 3px 2px;">CONTACT DETAILS</th>
                    </tr>
                </thead>
                <tbody style="font-size: 6.8pt; line-height: 1.15;">
                    ${tbodyRows}
                </tbody>
            </table>
        </div>
    `;
}
