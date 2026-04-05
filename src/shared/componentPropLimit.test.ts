import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const componentsRoot = path.join(projectRoot, "src/presentation/components");
const propDeclarationPattern =
  /(interface|type)\s+([A-Za-z0-9_]*Props)\s*(?:=\s*)?\{/g;

type PropDefinition = Readonly<{
  count: number;
  filePath: string;
  name: string;
}>;

type MemberSplitState = Readonly<{
  bracketDepth: number;
  buffer: string;
  curlyDepth: number;
  members: ReadonlyArray<string>;
  parenDepth: number;
}>;

type BlockState = Readonly<{
  block: string;
  depth: number;
  done: boolean;
}>;

const listComponentFiles = (directoryPath: string): ReadonlyArray<string> =>
  fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return listComponentFiles(entryPath);
    }

    return entryPath.endsWith(".tsx") ? [entryPath] : [];
  });

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const adjustDepth = (
  character: string,
  depth: number,
  openCharacter: string,
  closeCharacter: string,
): number => {
  if (character === openCharacter) {
    return depth + 1;
  }

  if (character === closeCharacter) {
    return depth - 1;
  }

  return depth;
};

const collectPropBlock = (source: string, startIndex: number): string =>
  Array.from(source.slice(startIndex)).reduce<BlockState>(
    (state, character) => {
      if (state.done === true) {
        return state;
      }

      const nextDepth = adjustDepth(character, state.depth, "{", "}");

      if (character === "}" && nextDepth === 0) {
        return {
          block: state.block,
          depth: nextDepth,
          done: true,
        };
      }

      return {
        block: `${state.block}${character}`,
        depth: nextDepth,
        done: false,
      };
    },
    {
      block: "",
      depth: 1,
      done: false,
    },
  ).block;

const splitTopLevelMembers = (source: string): ReadonlyArray<string> =>
  Array.from(source).reduce<MemberSplitState>(
    (state, character) => {
      const nextParenDepth = adjustDepth(character, state.parenDepth, "(", ")");
      const nextBracketDepth = adjustDepth(
        character,
        state.bracketDepth,
        "[",
        "]",
      );
      const nextCurlyDepth = adjustDepth(character, state.curlyDepth, "{", "}");
      const nextBuffer = `${state.buffer}${character}`;
      const isTopLevelDelimiter =
        character === ";" &&
        state.parenDepth === 0 &&
        state.bracketDepth === 0 &&
        state.curlyDepth === 0;

      if (isTopLevelDelimiter === true) {
        return {
          bracketDepth: nextBracketDepth,
          buffer: "",
          curlyDepth: nextCurlyDepth,
          members: [...state.members, nextBuffer],
          parenDepth: nextParenDepth,
        };
      }

      return {
        bracketDepth: nextBracketDepth,
        buffer: nextBuffer,
        curlyDepth: nextCurlyDepth,
        members: state.members,
        parenDepth: nextParenDepth,
      };
    },
    {
      bracketDepth: 0,
      buffer: "",
      curlyDepth: 0,
      members: [],
      parenDepth: 0,
    },
  ).members;

const isPropMember = (member: string): boolean =>
  /^[A-Za-z0-9_]+\??:/.test(member.trim());

const getPropDefinitions = (filePath: string): ReadonlyArray<PropDefinition> => {
  const source = stripComments(fs.readFileSync(filePath, "utf8"));

  return Array.from(source.matchAll(propDeclarationPattern)).map((match) => {
    const startIndex = match.index;
    const name = match[2] ?? "";
    const block =
      typeof startIndex === "number"
        ? collectPropBlock(source, startIndex + match[0].length)
        : "";
    const topLevelMembers = splitTopLevelMembers(block).filter(isPropMember);

    return {
      count: topLevelMembers.length,
      filePath,
      name,
    };
  });
};

describe("presentation component props", () => {
  it("keeps top-level component props at five or fewer", () => {
    const offenders = listComponentFiles(componentsRoot)
      .flatMap(getPropDefinitions)
      .filter((definition) => definition.count > 5)
      .map(
        (definition) =>
          `${path.relative(projectRoot, definition.filePath)}:${definition.name}:${definition.count}`,
      );

    expect(offenders).toStrictEqual([]);
  });
});
