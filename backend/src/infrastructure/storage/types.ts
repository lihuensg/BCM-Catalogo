/** Provider-neutral boundary; implementation and upload validation belong to a later stage. */
export interface StoredAsset {
    key: string;
    url: string;
}
export interface AssetStorage {
    upload(input: {
        content: Uint8Array;
        contentType: string;
        key: string;
    }): Promise<StoredAsset>;
    remove(key: string): Promise<void>;
}
