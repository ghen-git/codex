export class LinkedListNode<T> {
    prev: LinkedListNode<T> | null;
    next: LinkedListNode<T> | null;
    value: T;

    constructor(value: T) {
        this.value = value;
        this.prev = null;
        this.next = null;
    }

    remove() {
        if (this.prev !== null)
            this.prev.next = this.next;
        if (this.next !== null)
            this.next.prev = this.prev;
    }
}

export class LinkedList<T> {
    start: LinkedListNode<T> | null;
    end: LinkedListNode<T> | null;
    length: number;
    constructor() {
        this.start = null;
        this.end = null;
        this.length = 0;
    }

    push(nodeValue: T) {
        const node = new LinkedListNode(nodeValue);

        if (this.start == null) {
            this.start = node;
            this.end = node;
        }
        else {
            this.end!.next = node;
            node.prev = this.end;
            this.end = node;
        }
        this.length++;
        return node;
    }

    remove(node: LinkedListNode<T>) {
        if (node == this.start) {
            this.start = node.next;
        }
        else if (node == this.end) {
            this.end = node.prev;
        }

        this.length--;
        node.remove();
    }

    forEach(iterationCallback: (value: T, i: number, node: LinkedListNode<T>) => void) {
        let i = 0;
        let currNode = this.start;
        while (currNode != null) {
            iterationCallback(currNode.value, i, currNode);
            currNode = currNode.next;
        }
    }
}