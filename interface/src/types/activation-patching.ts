export interface Connection {
    start: { 
        x: number; 
        y: number; 
        tokenIndices: number[]; // Array of token indices in the group
        counterIndex: number; // 0 for first counter, 1 for second counter
    };
    end: { 
        x: number; 
        y: number; 
        tokenIndices: number[]; // Array of token indices in the group
        counterIndex: number; // 0 for first counter, 1 for second counter
    };
}