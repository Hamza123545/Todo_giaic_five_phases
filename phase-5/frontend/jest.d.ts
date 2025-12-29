import "@testing-library/jest-dom";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Matchers<R> extends TestingLibraryMatchers<typeof expect.stringContaining, R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
    }
  }
}
