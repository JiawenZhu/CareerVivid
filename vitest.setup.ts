import '@testing-library/jest-dom';

// Stub DataTransfer for jsdom tests
if (typeof globalThis.DataTransfer === 'undefined') {
  class MockDataTransfer {
    private fileList: File[] = [];

    get files(): FileList {
      const list = [...this.fileList] as unknown as FileList;
      Object.defineProperty(list, 'item', {
        value: (index: number) => this.fileList[index] || null,
        writable: true,
        configurable: true
      });
      return list;
    }

    get items() {
      return {
        add: (file: File) => {
          this.fileList.push(file);
        }
      };
    }
  }

  globalThis.DataTransfer = MockDataTransfer as any;
}

