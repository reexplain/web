import { render, screen } from "@testing-library/react";
import PracticeActivityPair from "@/components/dashboard/PracticeActivityPair";

jest.mock("@/components/dashboard/Flashcard", () =>
  function FlashcardMock({ item }: { item: { id: string; excerpt: string } }) {
    return <div>Flashcard: {item.id} {item.excerpt}</div>;
  },
);
jest.mock("@/components/dashboard/Quiz", () =>
  function QuizMock({ items }: { items: Array<{ excerpt: string; id: string }> }) {
    return (
      <div>
        <div>Quiz: {items.map((item) => item.id).join(",")}</div>
        <div>Quiz options: {items.map((item) => item.excerpt).join(" | ")}</div>
      </div>
    );
  },
);

const excerpts = [
  { id: "concept-1", excerpt: "Initial concept", sequence: 0 },
  { id: "concept-2", excerpt: "Second concept", sequence: 1 },
  { id: "concept-3", excerpt: "Third concept", sequence: 2 },
  { id: "concept-4", excerpt: "Fourth concept", sequence: 3 },
  { id: "concept-5", excerpt: "Fifth concept", sequence: 4 },
];

describe("PracticeActivityPair", () => {
  it("renders one flashcard and one four-option quiz", () => {
    render(<PracticeActivityPair excerpts={excerpts} />);

    expect(screen.getByText("Flashcard: concept-1 Initial concept")).toBeInTheDocument();
    expect(screen.getByText("Quiz: concept-2,concept-3,concept-4,concept-5"))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Practice activities")).toHaveClass(
      "auto-rows-fr",
      "lg:grid-cols-2",
    );
  });

  it("fills a short batch with source-agnostic quiz options", () => {
    render(<PracticeActivityPair excerpts={excerpts.slice(0, 3)} />);

    expect(screen.getByText("Quiz: concept-2,concept-3,concept-1,quiz-fallback-0"))
      .toBeInTheDocument();
    expect(screen.getByText(/Quiz options:/)).not.toHaveTextContent(
      /document|pdf|source|passage|excerpt|learning material|author|text|file|session|conversation/i,
    );
  });
});
