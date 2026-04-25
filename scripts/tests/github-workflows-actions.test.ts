import { readFileSync } from 'node:fs';

const workflowActionExpectations = [
  {
    filePath: '.github/workflows/pull-request.yml',
    actions: [
      'actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd',
      'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
      'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
      'actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830',
    ],
  },
  {
    filePath: '.github/workflows/dependencies-update.yml',
    actions: [
      'actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd',
      'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
      'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
    ],
  },
  {
    filePath: '.github/workflows/ci-cd-automation.yml',
    actions: [
      'actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd',
      'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
      'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
    ],
  },
];

describe('GitHub workflow action pins', () => {
  it.each(workflowActionExpectations)(
    'keeps $filePath on the current pinned GitHub Action revisions',
    ({ actions, filePath }) => {
      const workflow = readFileSync(filePath, 'utf8');

      for (const action of actions) {
        expect(workflow).toContain(action);
      }
    },
  );
});
