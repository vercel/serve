import { describe, expect, it } from 'vitest';
import { getHelpText } from '../source/utilities/cli';

describe('--help', () => {
  it('snapshot', () => {
    expect(getHelpText()).toMatchSnapshot();
  });
});
