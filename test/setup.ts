import "@testing-library/jest-dom";
import * as matchers from "vitest-axe/matchers.js";
import { expect } from "vitest";

expect.extend(matchers);
