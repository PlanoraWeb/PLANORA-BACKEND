# Planora Veritabanı ER Diyagramı

Bu diyagram [Mermaid](https://mermaid.js.org/) formatında hazırlanmıştır. VS Code / Cursor üzerinde Markdown önizlemesi (**Ctrl+Shift+V** veya sağ üstteki önizleme butonu) ile görsel olarak görüntülenebilir.

```mermaid
erDiagram
    ROLE ||--o{ USER : "atanan kullanıcılar"
    ROLE ||--o{ PROJECT_MEMBER : "proje içi roller"

    USER ||--o{ PROJECT : "oluşturduğu projeler (createdProjects)"
    USER ||--o{ PROJECT_MEMBER : "dahil olduğu projeler (memberships)"
    USER ||--o{ TASK : "atandığı görevler (assignee)"
    USER ||--o{ TASK : "oluşturduğu görevler (reporter)"
    
    PROJECT ||--o{ PROJECT_MEMBER : "proje üyeleri"
    PROJECT ||--o{ TASK_STATUS : "kanban kolonları"
    PROJECT ||--o{ TASK : "görevler"
    
    TASK_STATUS ||--o{ TASK : "görev durumu"

    ROLE {
        string id PK
        string name UK "Örn: System Admin, Project Admin, Member"
    }

    USER {
        string id PK
        string name
        string email UK
        string password
        string roleId FK
        dateTime createdAt
        dateTime updatedAt
    }

    PROJECT {
        string id PK
        string projectName
        string description
        string createdById FK
        dateTime createdAt
        dateTime updatedAt
    }

    PROJECT_MEMBER {
        string id PK
        string projectId FK
        string userId FK
        string roleId FK
    }

    TASK_STATUS {
        string id PK
        string name
        int position
        boolean isDefault
        string projectId FK
        dateTime createdAt
    }

    TASK {
        string id PK
        string title
        string description
        string priority "ENUM: LOW, MEDIUM, HIGH, URGENT"
        string type "ENUM: BUG, TASK, STORY"
        string statusId FK
        string projectId FK
        string reporterId FK "Oluşturan"
        string assigneeId FK "Atanan"
        dateTime dueDate
        dateTime createdAt
        dateTime updatedAt
    }
```
