┌─────────────────┐
│  Upload (.csv)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  ImportService          │
│  - chooseParser()       │
│  - parse() → records[]  │
│  - deduplicate()        │
│  - categorize()         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  TransactionParser (iface)  │
└──┬─────────────────────┬────┘
   │                     │
   ▼                     ▼
┌──────────┐       ┌──────────┐
│ CSVParser│       │ OFXParser│
└──────────┘       └──────────┘