# Prisma Migration: Add isActive to Skill

## Schema Change
在 `prisma/schema.prisma` 的 `Skill` model 中新增：

```prisma
model Skill {
  id          String   @id @default(uuid())
  name        String
  avatar      String
  expertise   String
  personality String
  prompt      String
  signature   String
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)    // ← 新增欄位
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ownerId     String?
  owner       User?    @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  @@index([ownerId])
  @@index([isDefault])
  @@index([isActive])                     // ← 新增索引
}
```

## Migration Command
```bash
npx prisma migrate dev --name add-skill-isActive
```

## What This Enables
- Admin can toggle skills on/off without deleting them
- `isActive: false` skills won't appear in user's skill list
- All existing skills default to `isActive: true`
