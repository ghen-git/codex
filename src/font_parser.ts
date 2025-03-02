export async function parseFont(fontUrl: string) {
    const buffer = (await (await fetch(fontUrl)).body!.getReader().read()).value!;
    const reader = new FontFileReader(buffer);

    reader.skip(4);
    
    const tableCount = reader.readInt16();

    reader.skip(6);

    let glyfOffset = 0;
    let glyfLength = 0;

    for(let i = 0; i < tableCount; i++) {
        const tag = reader.readTag();
        const checksum = reader.readInt32();
        const offset = reader.readInt32();
        const length = reader.readInt32();

        if(tag == 'glyf') {
            glyfOffset = offset;
            glyfLength = length;
        }
    }

    reader.setPos(glyfOffset);
    const nContours = reader.readInt16();
    console.log(nContours);

    console.log(reader.readFWord());
    console.log(reader.readFWord());
    console.log(reader.readFWord());
    console.log(reader.readFWord());
    for(let i = 0; i < nContours; i++)
        console.log(reader.readInt16());
    console.log(reader.readInt16());
}

class FontFileReader {
    byte: number;
    data: Uint8Array;

    constructor(data: Uint8Array) {
        this.data = data;
        this.byte = 0;
    }

    public readTag(): string {
        let tag = "";

        for(let i = 0; i < 4; i++)
            tag += this.readChar();

        return tag;
    }

    public readChar(): string {
        return String.fromCharCode(this.data[this.byte++]);
    }
    
    public readInt16(): number {
        return this.data[this.byte++] << 8 | 
            this.data[this.byte++];
    }
    
    public readFWord(): number {
        const sign = this.data[this.byte] >> 7 == 1 ? -1 : 1;

        const fWord: number = (
            (this.data[this.byte] & 0x0111111) << 8 | 
            this.data[this.byte + 1]) * sign;
        this.byte+=2;

        return fWord;

    }
    
    public readInt32(): number {
        return this.data[this.byte++] << 24 | 
            this.data[this.byte++] << 16 | 
            this.data[this.byte++] << 8 | 
            this.data[this.byte++];
    }
    
    public skip(bytes: number) {
        this.byte += bytes;
    }
    
    public setPos(byte: number) {
        this.byte += byte;
    }
}