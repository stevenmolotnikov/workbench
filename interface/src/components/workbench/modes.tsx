import { BarChart, LineChart, Network, Brain } from "lucide-react";


export const LogitLensModes = [
    {
        name: "Token Analysis",
        description: "Probability of the target token per layer.",
        icon: <BarChart className="h-6 w-6" />
    },
    {
        name: "Entropy Analysis",
        description: "Entropy of the target token per layer.",
        icon: <LineChart className="h-6 w-6" />
    },
    {
        name: "Attention Visualization",
        description: "Visualize attention patterns across transformer heads.",
        icon: <Network className="h-6 w-6" />
    },
    {
        name: "Neuron Activation",
        description: "Analyze individual neuron activations by layer.",
        icon: <Brain className="h-6 w-6" />
    }
]
