import { render, screen } from "@testing-library/react";
import PracticeConcepts from "@/components/dashboard/PracticeConcepts";

jest.mock("@/components/dashboard/Flashcard", () =>
  function FlashcardMock({ item }: { item: { id: string; excerpt: string } }) {
    return <div>Flashcard: {item.id} {item.excerpt}</div>;
  },
);
jest.mock("@/components/dashboard/Quiz", () =>
  function QuizMock({ items }: { items: Array<{ id: string }> }) {
    return <div>Quiz: {items.map((item) => item.id).join(",")}</div>;
  },
);

const initialExcerpts = [
  { id: "chunk-1:0", excerpt: "Initial concept", sequence: 0 },
  { id: "chunk-2:0", excerpt: "Second concept", sequence: 1 },
  { id: "chunk-3:0", excerpt: "Third concept", sequence: 2 },
  { id: "chunk-4:0", excerpt: "Fourth concept", sequence: 3 },
  { id: "chunk-5:0", excerpt: "Fifth concept", sequence: 4 },
  { id: "chunk-6:0", excerpt: "Sixth concept", sequence: 5 },
  { id: "chunk-7:0", excerpt: "Seventh concept", sequence: 6 },
];

describe("PracticeConcepts", () => {
  it("renders the supplied practice statements", () => {
    render(<PracticeConcepts excerpts={initialExcerpts} />);

    expect(screen.getByRole("heading", { name: "Practice concepts" }).closest("section"))
      .toHaveClass("scroll-mt-40", "lg:scroll-mt-8");
    expect(screen.getByText("Flashcard: chunk-1:0 Initial concept")).toBeInTheDocument();
    expect(screen.getByText("Quiz: chunk-2:0,chunk-3:0,chunk-4:0")).toBeInTheDocument();
    expect(screen.queryByText(/reorder/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Practice activities")).toHaveClass("lg:grid-cols-2", "auto-rows-fr");
  });

  it("shows the empty state when the realtime snapshot has no practice", () => {
    render(<PracticeConcepts excerpts={[]} />);

    expect(screen.queryByText("Flashcard: chunk-1:0 Initial concept")).not.toBeInTheDocument();
    expect(
      screen.getByText("Discuss a concept to unlock practice"),
    ).toBeInTheDocument();
  });

  it("switches to replacement practice when props update", () => {
    const { rerender } = render(<PracticeConcepts excerpts={initialExcerpts} />);
    rerender(
      <PracticeConcepts
        excerpts={[{ id: "chunk-4:0", excerpt: "Replacement concept", sequence: 0 }]}
      />,
    );

    expect(screen.getByText("Flashcard: chunk-4:0 Replacement concept")).toBeInTheDocument();
    expect(screen.queryByText("Flashcard: chunk-1:0 Initial concept")).not.toBeInTheDocument();
  });
});
