// Donor type system for enemies
// Enemies become donors with types that determine their value and visual style

export const DONOR_TYPES = {
    SMALL: {
        name: 'SMALL',
        color: '#2A9D8F',    // Teal
        value: 25,
        label: '$25',
        askMatch: 'letter',
    },
    MID: {
        name: 'MID',
        color: '#E9C46A',    // Gold
        value: 100,
        label: '$100',
        askMatch: 'phone',
    },
    MAJOR: {
        name: 'MAJOR',
        color: '#C1272D',    // Crimson
        value: 1000,
        label: '$1K',
        askMatch: 'redcarpet',
    },
};

const DONOR_LIST = [DONOR_TYPES.SMALL, DONOR_TYPES.SMALL, DONOR_TYPES.SMALL, DONOR_TYPES.MID, DONOR_TYPES.MID, DONOR_TYPES.MAJOR];

let donorIndex = 0;

export function assignDonorType() {
    // Cycle through donor types with weighted distribution
    const type = DONOR_LIST[donorIndex % DONOR_LIST.length];
    donorIndex++;
    return type;
}

// Draw the donor type indicator above/on an entity
export function drawDonorIndicator(context, donorType, x, y, width, revealed) {
    if (!donorType) return;

    if (!revealed) {
        // Before Dataro reveal: grey silhouette indicator
        context.fillStyle = 'rgba(128, 128, 128, 0.5)';
        context.fillRect(x + 2, y - 3, width - 4, 2);
        return;
    }

    // After reveal: colored indicator with value label
    context.fillStyle = donorType.color;

    // Colored dot above head
    context.beginPath();
    context.arc(x + width / 2, y - 2, 2, 0, Math.PI * 2);
    context.fill();

    // Small colored bar under feet
    context.fillRect(x + 2, y + 16, width - 4, 1);
}
