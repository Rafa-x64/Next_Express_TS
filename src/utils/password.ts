import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10;

export async function hashPassword(pass: string): Promise<string>{
    return await bcrypt.hash(pass, SALT_ROUNDS);
}

export async function comparePassword(pass: string, hash: string): Promise<boolean>{
    return await bcrypt.compare(pass, hash)
}
