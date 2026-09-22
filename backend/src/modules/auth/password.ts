import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
export const hashPassword = (password: string) => argon2.hash(password, {
    type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1
});
let dummyHash: Promise<string> | undefined;
export async function verifyPassword(hash: string | undefined, password: string) {
    dummyHash ??= hashPassword(randomBytes(32).toString('hex'));
    const target = hash ?? await dummyHash;
    try {
        return await argon2.verify(target, password);
    }
    catch {
        return false;
    }
}
