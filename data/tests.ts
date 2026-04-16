export interface TestDataset {
  id: string;
  text: string;
  images: string[];
  json: string;
}

export const TEST_DATASETS: TestDataset[] = [
  {
    id: "test1",
    text: "Synoptic Operative Report",
    images: ["test1.jpg"],
    json: "test1.json",
  },
  // More entries will be added here
];
