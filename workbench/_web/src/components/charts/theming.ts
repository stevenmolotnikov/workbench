const fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif'

const baseTheme = {
    background: 'transparent',
    text: {
        fontSize: 11,
        fontFamily: fontFamily,
        fill: 'hsl(var(--foreground))',
        outlineWidth: 0,
        outlineColor: 'transparent'
    },
    axis: {
        domain: {
            line: {
                stroke: 'transparent',
                strokeWidth: 0
            }
        },
        legend: {
            text: {
                fontSize: 12,
                fontFamily: fontFamily,
                fill: 'hsl(var(--foreground))',
                outlineWidth: 0,
                outlineColor: 'transparent'
            }
        },
        ticks: {
            line: {
                stroke: 'hsl(var(--border))',
                strokeWidth: 1
            },
            text: {
                fontSize: 11,
                fontFamily: fontFamily,
                fill: 'hsl(var(--muted-foreground))',
                outlineWidth: 0,
                outlineColor: 'transparent'
            }
        }
    },
    legends: {
        title: {
            text: {
                fontSize: 11,
                fontFamily: fontFamily,
                fill: 'hsl(var(--foreground))',
                outlineWidth: 0,
                outlineColor: 'transparent'
            }
        },
        text: {
            fontSize: 11,
            fontFamily: fontFamily,
            fill: 'hsl(var(--foreground))',
            outlineWidth: 0,
            outlineColor: 'transparent'
        },
        ticks: {
            line: {},
            text: {
                fontSize: 10,
                fontFamily: fontFamily,
                fill: 'hsl(var(--foreground))',
                outlineWidth: 0,
                outlineColor: 'transparent'
            }
        }
    },
    annotations: {
        text: {
            fontSize: 13,
            fontFamily: fontFamily,
            fill: 'hsl(var(--foreground))',
            outlineWidth: 2,
            outlineColor: 'hsl(var(--background))',
            outlineOpacity: 1
        },
        link: {
            stroke: 'hsl(var(--foreground))',
            strokeWidth: 1,
            outlineWidth: 2,
            outlineColor: 'hsl(var(--background))',
            outlineOpacity: 1
        },
        outline: {
            stroke: 'hsl(var(--foreground))',
            strokeWidth: 2,
            outlineWidth: 2,
            outlineColor: 'hsl(var(--background))',
            outlineOpacity: 1
        },
        symbol: {
            fill: 'hsl(var(--foreground))',
            outlineWidth: 2,
            outlineColor: 'hsl(var(--background))',
            outlineOpacity: 1
        }
    },
    tooltip: {
        wrapper: {},
        container: {
            background: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            fontSize: 12,
            fontFamily: fontFamily,
            borderRadius: 'calc(var(--radius) - 2px)',
            boxShadow: 'var(--shadow-lg)',
            padding: '5px 9px'
        },
        basic: {},
        chip: {},
        table: {},
        tableCell: {},
        tableCellValue: {}
    },
    grid: {
        line: {
            stroke: 'hsl(var(--border))',
            strokeWidth: 1,
            strokeOpacity: 0.3
        }
    },
    crosshair: {
        line: {
            stroke: 'hsl(var(--muted-foreground))',
            strokeWidth: 1,
            strokeOpacity: 0.75,
            strokeDasharray: '6 6'
        }
    }
}

export const lineTheme = baseTheme

export const heatmapTheme = {
    ...baseTheme,
    labels: {
        text: {
            fontSize: 10,
            fontFamily: fontFamily,
            fill: 'hsl(var(--foreground))',
            outlineWidth: 0,
            outlineColor: 'transparent'
        }
    }
}