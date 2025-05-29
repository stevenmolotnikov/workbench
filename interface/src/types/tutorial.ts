import { type StepType } from "@reactour/tour";

interface TutorialChapterProgress {
    title: string;
    steps: StepType[];
    currentStep?: number;
    completed: boolean;
}

interface TutorialProgress {
    chapters: TutorialChapterProgress[];
    description: string;
    currentChapter?: number;
}

const LogitLensBeginner: StepType[] = [
    {
        selector: "#new-completion",
        content:
            "Create a new completion. This uses the model selected to the left. Use the default model.",
    },
    {
        selector: "#completion-text",
        content:
            "This is the second step of your tour. Here you can learn about different features.",
    },
    {
        selector: "#view-predictions",
        content: "This is the final step. You're now ready to explore the application!",
    },
    {
        selector: "#predictions-display",
        content: "This is the final step. You're now ready to explore the application!",
    },
];

const LogitLensIntermediate: StepType[] = [
    {
        selector: "#new-completion",
        content: "For most experiments, the best prompts will be incomplete statements with a correct, expected single-token solution. Start by entering a prompt like `The Eiffel Tower is in the city of`",
    },
];

const LogitLensTutorialChapters: TutorialChapterProgress[] = [
    {
        title: "Logit Lens Beginner",
        steps: LogitLensBeginner,
        completed: false,
    },
    {
        title: "Logit Lens Intermediate",
        steps: LogitLensIntermediate,
        completed: false,
    },
];

export const LogitLensTutorial: TutorialProgress = {
    chapters: LogitLensTutorialChapters,
    currentChapter: 0,
    description: "Logit Lens is a tool that allows you to visualize the internal states of a model. It works by inserting a language modeling head at intermediate layers of the model. This lets you see what the model is \"thinking\" at each step of processing.",
};