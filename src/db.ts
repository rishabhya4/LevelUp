// Simple in-memory storage (temporary solution)
interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}

class TempDB {
  private users: User[] = [];

  addUser(email: string, password: string): User {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password, // In a real app, this should be hashed
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  findUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }
}

export const db = new TempDB();