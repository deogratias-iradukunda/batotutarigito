import "dotenv/config";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

// Check if DATABASE_URL is configured
const connectionString = process.env.DATABASE_URL;

let prisma: any;
let isMock = false;

if (!connectionString || connectionString.trim() === "" || connectionString.includes("ADD_YOUR_DATABASE_URL") || connectionString.includes("placeholder")) {
  console.warn("📁 DATABASE_URL environment variable is missing or placeholder. Running in-memory mock database mode.");
  isMock = true;
} else {
  try {
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
    console.log("⚡ successfully initialized PostgreSQL Prisma connection pool.");
  } catch (error) {
    console.error("❌ Failed to initialize Prisma PostgreSQL client. Falling back to in-memory mock database:", error);
    isMock = true;
  }
}

let useMockDb = isMock;

export const getUseMockDb = () => useMockDb;
export const setUseMockDb = (val: boolean) => {
  useMockDb = val;
};

// Pre-hashed default password for fast module loading
const hashedDefaultPassword = bcrypt.hashSync("admin123", 10);

const dbStore: Record<string, any[]> = {
  user: [
    {
      id: "u-admin-1",
      email: "admin@batotutarigito.org",
      password: hashedDefaultPassword,
      name: "System Administrator",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "u-admin-2",
      email: "munyeshuriolivier6@gmail.com",
      password: hashedDefaultPassword,
      name: "Olivier Munyeshuri",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "u-student-1",
      email: "jean@batotutarigito.org",
      password: hashedDefaultPassword,
      name: "Jean de Dieu Niyomugabo",
      role: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "u-student-2",
      email: "claire@batotutarigito.org",
      password: hashedDefaultPassword,
      name: "Marie Claire Uwase",
      role: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ],
  student: [
    {
      id: "s-student-1",
      userId: "u-student-1",
      telephone: "+250 788 123 456",
      gender: "Male",
      department: "Computer Science",
      level: "Level 4",
      startDate: new Date("2023-09-01"),
      endDate: null,
      profileImage: "/admin.webp",
      sector: "Rubengera",
      cell: "Gisiza",
      village: "Kigarama",
      isGraduated: false,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "s-student-2",
      userId: "u-student-2",
      telephone: "+250 788 654 321",
      gender: "Female",
      department: "Nursing",
      level: "Level 2",
      startDate: new Date("2024-01-15"),
      endDate: null,
      profileImage: "/gufasha.webp",
      sector: "Bwishyura",
      cell: "Kibuye",
      village: "Ruganda",
      isGraduated: false,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ],
  family: [
    {
      id: "f-family-1",
      name: "Nsengimana Emmanuel Family",
      username: "nsengimana_fam",
      telephone: "+250 785 111 222",
      sector: "Rubengera",
      cell: "Gisiza",
      village: "Isangano",
      cowProjectSource: "BatoTutariGito Fund",
      cowProjectDate: new Date("2024-02-14"),
      cowProjectAmount: 350000,
      calvesSource: "Firstborn Calf Pass",
      calvesAmount: 0,
    },
    {
      id: "f-family-2",
      name: "Mukamana Solange Family",
      username: "mukamana_fam",
      telephone: "+250 783 333 444",
      sector: "Murundi",
      cell: "Kamegeri",
      village: "Urumuri",
      cowProjectSource: "Pass on the Gift Program",
      cowProjectDate: new Date("2024-06-12"),
      cowProjectAmount: 320000,
      calvesSource: "Direct Project Allocation",
      calvesAmount: 1,
    }
  ],
  cow: [
    {
      id: "c-cow-1",
      cowNumber: "COW-B001",
      dateReceived: new Date("2024-01-10"),
      purchaseAmount: 350000,
      parentCowId: null,
      calves: 1,
      value: 410000,
      medicineExpenses: 12000,
      glassesExpenses: 0,
      otherExpenses: 5000,
      status: "active",
      sellingPrice: 0,
      createdAt: new Date(),
      familyId: "f-family-1"
    },
    {
      id: "c-cow-2",
      cowNumber: "COW-B002",
      dateReceived: new Date("2024-03-22"),
      purchaseAmount: 320000,
      parentCowId: null,
      calves: 0,
      value: 360000,
      medicineExpenses: 4000,
      glassesExpenses: 0,
      otherExpenses: 2000,
      status: "active",
      sellingPrice: 0,
      createdAt: new Date(),
      familyId: "f-family-2"
    }
  ],
  calf: [
    {
      id: "calf-1",
      cowId: "c-cow-1",
      fromFamilyId: "f-family-1",
      toFamilyId: "f-family-2",
      transferDate: new Date("2025-05-18"),
      createdAt: new Date()
    }
  ],
  announcement: [
    {
      id: "a-ann-1",
      title: "Pass on the Gift Call to Families",
      description: "We are pleased to celebrate Mukamana Family for passing on their first-born calf to another beneficiary family under the Rubengera agricultural program.",
      images: ["/cow2.webp"],
      published: true,
      createdAt: new Date("2026-05-15T10:00:00Z"),
    },
    {
      id: "a-ann-2",
      title: "Community Umuganda Highlights",
      description: "Over 200 members of Batotutarigito youth groups joined hands with the local Rubengera leadership to construct primary school pathways and agricultural ridges.",
      images: ["/umuganda.webp"],
      published: true,
      createdAt: new Date("2026-05-10T08:30:00Z"),
    },
    {
      id: "a-ann-3",
      title: "New Student Academic Progress Review",
      description: "Our quarterly sponsorship evaluation reports that 95% of sponsored primary and secondary students achieved passing marks, with 12 students joining university classes.",
      images: ["/gufasha2.webp"],
      published: true,
      createdAt: new Date("2026-05-01T14:00:00Z"),
    }
  ],
  comment: [
    {
      id: "cm-1",
      name: "Habimana Jean",
      email: "habimana@gmail.com",
      message: "Please let us know how family sponsors can transfer cow treatment certificates.",
      status: "pending",
      createdAt: new Date(),
    }
  ],
  share: [
    {
      id: "sh-1",
      userId: "u-student-1",
      userName: "Jean de Dieu Niyomugabo",
      amount: 150000,
      shareDate: new Date("2025-01-01"),
      expiryDate: new Date("2026-12-31"),
      status: "active",
      createdAt: new Date(),
    }
  ],
  supportRecord: [
    {
      id: "sr-1",
      beneficiaryName: "Gahigi Family",
      telephone: "+250 782 555 444",
      address: "Rubengera Cell, Rubengera Sector",
      date: new Date("2025-02-01"),
      supportType: "Livestock Feed Provision",
      createdAt: new Date(),
    }
  ],
  expense: [
    {
      id: "exp-1",
      cowNumber: "COW-B001",
      type: "medicines",
      amount: 12000,
      date: new Date("2025-05-10"),
      createdAt: new Date(),
    },
    {
      id: "exp-2",
      cowNumber: "COW-B002",
      type: "foods",
      amount: 25000,
      date: new Date("2025-05-12"),
      createdAt: new Date(),
    },
    {
      id: "exp-3",
      cowNumber: "COW-B001",
      type: "vet",
      amount: 15000,
      date: new Date("2025-05-14"),
      createdAt: new Date(),
    }
  ],
};

class MockPrismaTable {
  private dataList: any[];
  private tableName: string;

  constructor(tableName: string, initialData: any[] = []) {
    this.tableName = tableName;
    this.dataList = initialData;
  }

  get data() {
    return this.dataList;
  }

  async count(options?: any) {
    if (options && options.where) {
      return this.filterData(options.where).length;
    }
    return this.data.length;
  }

  async findMany(options?: any) {
    let items = [...this.data];
    if (options && options.where) {
      items = this.filterData(options.where);
    }
    
    // Sort logic
    if (options && options.orderBy) {
      const orderKeys = Object.keys(options.orderBy);
      if (orderKeys.length > 0) {
        const key = orderKeys[0];
        const dir = options.orderBy[key];
        items.sort((a, b) => {
          const aVal = a[key];
          const bVal = b[key];
          if (aVal === bVal) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          if (dir === "desc") {
            return aVal < bVal ? 1 : -1;
          } else {
            return aVal > bVal ? 1 : -1;
          }
        });
      }
    }

    // Include logic
    if (options && options.include) {
      items = items.map(item => this.resolveIncludes({ ...item }, options.include));
    }

    return items;
  }

  async findUnique(options?: any) {
    const where = options?.where || {};
    const item = this.data.find(row => {
      return Object.entries(where).every(([key, val]) => {
        if (typeof val === "object" && val !== null) {
          const valObj = val as any;
          if ("equals" in valObj) {
            return String(row[key]).toLowerCase() === String(valObj.equals).toLowerCase();
          }
        }
        return row[key] === val;
      });
    });
    if (!item) return null;
    if (options && options.include) {
      return this.resolveIncludes({ ...item }, options.include);
    }
    return { ...item };
  }

  async findFirst(options?: any) {
    const items = await this.findMany(options);
    return items[0] || null;
  }

  async create(options?: any) {
    const fields = options?.data || {};
    const id = fields.id || Math.random().toString(36).substring(2, 11);
    
    const newItem = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const flatData: any = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value && typeof value === "object" && "create" in (value as any)) {
        const relatedTable = key; 
        const relatedData = (value as any).create;
        const relatedId = Math.random().toString(36).substring(2, 11);
        
        const nestedItem = {
          id: relatedId,
          userId: id,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...relatedData
        };
        dbStore[relatedTable].push(nestedItem);
      } else {
        flatData[key] = value;
      }
    }

    Object.assign(newItem, flatData);
    this.data.push(newItem);
    return { ...newItem };
  }

  async update(options?: any) {
    const where = options?.where || {};
    const updateFields = options?.data || {};
    const index = this.data.findIndex(row => {
      return Object.entries(where).every(([key, val]) => row[key] === val);
    });

    if (index === -1) {
      throw new Error(`Record not found for update in ${this.tableName}`);
    }

    const currentItem = this.data[index];
    const updated = {
      ...currentItem,
      ...updateFields,
      updatedAt: new Date()
    };
    this.data[index] = updated;
    return { ...updated };
  }

  async delete(options?: any) {
    const where = options?.where || {};
    const index = this.data.findIndex(row => {
      return Object.entries(where).every(([key, val]) => row[key] === val);
    });

    if (index === -1) {
      throw new Error(`Record not found for delete in ${this.tableName}`);
    }

    const deleted = this.data.splice(index, 1)[0];
    return deleted;
  }

  private filterData(where: any): any[] {
    return this.data.filter(row => {
      return Object.entries(where).every(([key, val]) => {
        if (key === "OR" && Array.isArray(val)) {
          return val.some(subWhere => {
            return Object.entries(subWhere).every(([sk, sv]) => {
              if (sk === "email" && typeof sv === "object" && sv !== null && "equals" in sv) {
                const equalsVal = (sv as any).equals;
                return String(row[sk]).toLowerCase() === String(equalsVal).toLowerCase();
              }
              return row[sk] === sv;
            });
          });
        }
        if (typeof val === "object" && val !== null) {
          const valObj = val as any;
          if ("equals" in valObj) {
            return String(row[key]).toLowerCase() === String(valObj.equals).toLowerCase();
          }
        }
        return row[key] === val;
      });
    });
  }

  private resolveIncludes(item: any, include: any): any {
    const result = { ...item };
    for (const [key, shouldInclude] of Object.entries(include)) {
      if (shouldInclude) {
        if (key === "student") {
          const student = dbStore["student"].find(s => s.userId === item.id);
          result.student = student ? { ...student } : null;
        } else if (key === "user") {
          const user = dbStore["user"].find(u => u.id === item.userId);
          result.user = user ? { ...user } : null;
        } else if (key === "family") {
          const f = dbStore["family"].find(family => family.id === item.familyId);
          result.family = f ? { ...f } : null;
        } else if (key === "cow") {
          const c = dbStore["cow"].find(cow => cow.id === item.cowId);
          result.cow = c ? { ...c } : null;
        } else if (key === "fromFamily") {
          const f = dbStore["family"].find(family => family.id === item.fromFamilyId);
          result.fromFamily = f ? { ...f } : null;
        } else if (key === "toFamily") {
          const f = dbStore["family"].find(family => family.id === item.toFamilyId);
          result.toFamily = f ? { ...f } : null;
        }
      }
    }
    return result;
  }
}

const makeTable = (name: string) => new MockPrismaTable(name, dbStore[name] || []);

const mockPrismaClient = {
  user: makeTable("user"),
  student: makeTable("student"),
  family: makeTable("family"),
  cow: makeTable("cow"),
  calf: makeTable("calf"),
  announcement: makeTable("announcement"),
  comment: makeTable("comment"),
  share: makeTable("share"),
  supportRecord: makeTable("supportRecord"),
  expense: makeTable("expense"),
  $connect: async () => {},
  $disconnect: async () => {},
};

// Create a Proxy routing to either mock or real prisma depending on status
const prismaExport = new Proxy({} as any, {
  get(target, prop) {
    if (prop === "getUseMockDb" || prop === "setUseMockDb") {
      return prop === "getUseMockDb" ? getUseMockDb : setUseMockDb;
    }
    if (prop === "$connect" || prop === "$disconnect") {
      return async () => {};
    }
    const model = useMockDb ? (mockPrismaClient as any)[prop] : (prisma as any)?.[prop];
    return model;
  }
});

export default prismaExport;
