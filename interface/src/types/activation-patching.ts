export interface Connection {
    start: { 
        x: number; 
        y: number; 
        tokenIndex: number;
        counterIndex: number; // 0 for first counter, 1 for second counter
    };
    end: { 
        x: number; 
        y: number; 
        tokenIndex: number;
        counterIndex: number; // 0 for first counter, 1 for second counter
    };
}