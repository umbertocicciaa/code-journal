import { describe, expect, it } from "vitest";
import {
  listJournalCompanies,
  listJournalTopics,
  listUserProblems,
} from "@/server/repositories/user-problems";
import { createTestUser, seedJournalEntry, uniqueSlug } from "./helpers";

describe("journal topic and company filters", () => {
  it("filters problems by topic and company", async () => {
    const user = await createTestUser();
    const arraySlug = uniqueSlug("filter-array");
    const graphSlug = uniqueSlug("filter-graph");

    const arrayEntry = await seedJournalEntry({
      userId: user.id,
      slug: arraySlug,
      title: "Array Problem",
      topics: [{ slug: "array", name: "Array" }],
      companies: [{ slug: "google", name: "Google" }],
    });
    await seedJournalEntry({
      userId: user.id,
      slug: graphSlug,
      title: "Graph Problem",
      topics: [{ slug: "graph", name: "Graph" }],
      companies: [{ slug: "amazon", name: "Amazon" }],
    });

    const topicId = arrayEntry.problem.problemTopics[0]?.topicId;
    expect(topicId).toBeDefined();

    const byTopic = await listUserProblems(user.id, { topicId });
    expect(byTopic.some((row) => row.problem.slug === arraySlug)).toBe(true);
    expect(byTopic.every((row) => row.problem.slug !== graphSlug)).toBe(true);

    const companyId = arrayEntry.problem.problemCompanies[0]?.companyId;
    expect(companyId).toBeDefined();

    const byCompany = await listUserProblems(user.id, { companyId });
    expect(byCompany.some((row) => row.problem.slug === arraySlug)).toBe(true);
    expect(byCompany.every((row) => row.problem.slug !== graphSlug)).toBe(true);
  });

  it("lists distinct topics and companies from the user's journal", async () => {
    const user = await createTestUser();
    await seedJournalEntry({
      userId: user.id,
      slug: uniqueSlug("topic-list-a"),
      topics: [{ slug: "tree", name: "Tree" }],
      companies: [{ slug: "meta", name: "Meta" }],
    });
    await seedJournalEntry({
      userId: user.id,
      slug: uniqueSlug("topic-list-b"),
      topics: [{ slug: "heap", name: "Heap" }],
      companies: [{ slug: "meta", name: "Meta" }],
    });

    const topics = await listJournalTopics(user.id);
    expect(topics.some((topic) => topic.name === "Tree")).toBe(true);
    expect(topics.some((topic) => topic.name === "Heap")).toBe(true);

    const companies = await listJournalCompanies(user.id);
    expect(companies.filter((company) => company.name === "Meta")).toHaveLength(
      1,
    );
  });
});
