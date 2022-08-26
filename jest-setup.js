require('@testing-library/jest-dom');

jest.doMock('express', () => {
  return () => {
    return {
      post: jest.fn(),
      use: jest.fn(),
      listen: jest.fn(),
    };
  };
});
