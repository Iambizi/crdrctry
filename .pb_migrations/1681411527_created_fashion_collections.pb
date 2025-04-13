{
  "modelVersion": "1.1.0",
  "collections": [
    {
      "id": "designers",
      "name": "designers",
      "type": "base",
      "system": false,
      "schema": [
        {
          "id": "name",
          "name": "name",
          "type": "text",
          "system": false,
          "required": true,
          "unique": true,
          "options": {
            "min": 1,
            "max": 255,
            "pattern": ""
          }
        },
        {
          "id": "bio",
          "name": "bio",
          "type": "text",
          "system": false,
          "required": false,
          "options": {
            "min": 0,
            "max": 2000
          }
        },
        {
          "id": "nationality",
          "name": "nationality",
          "type": "text",
          "system": false,
          "required": false,
          "options": {
            "min": 0,
            "max": 100
          }
        },
        {
          "id": "birth_year",
          "name": "birth_year",
          "type": "number",
          "system": false,
          "required": false,
          "options": {
            "min": 1800,
            "max": null
          }
        },
        {
          "id": "death_year",
          "name": "death_year",
          "type": "number",
          "system": false,
          "required": false,
          "options": {
            "min": 1800,
            "max": null
          }
        },
        {
          "id": "education",
          "name": "education",
          "type": "text",
          "system": false,
          "required": false,
          "options": {
            "min": 0,
            "max": 500
          }
        },
        {
          "id": "awards",
          "name": "awards",
          "type": "json",
          "system": false,
          "required": false
        },
        {
          "id": "notable_works",
          "name": "notable_works",
          "type": "json",
          "system": false,
          "required": false
        }
      ],
      "listRule": "",
      "viewRule": "",
      "createRule": "",
      "updateRule": "",
      "deleteRule": "",
      "indexes": [
        "CREATE UNIQUE INDEX idx_designer_name ON designers (name)"
      ]
    },
    {
      "id": "brands",
      "name": "brands",
      "type": "base",
      "system": false,
      "schema": [
        {
          "id": "name",
          "name": "name",
          "type": "text",
          "system": false,
          "required": true,
          "unique": true,
          "options": {
            "min": 1,
            "max": 255,
            "pattern": ""
          }
        },
        {
          "id": "founded_year",
          "name": "founded_year",
          "type": "number",
          "system": false,
          "required": false,
          "options": {
            "min": 1800,
            "max": null
          }
        },
        {
          "id": "founder",
          "name": "founder",
          "type": "text",
          "system": false,
          "required": false,
          "options": {
            "min": 0,
            "max": 255
          }
        },
        {
          "id": "category",
          "name": "category",
          "type": "select",
          "system": false,
          "required": true,
          "options": {
            "values": [
              "luxury_fashion",
              "ready_to_wear",
              "haute_couture",
              "accessories",
              "jewelry",
              "leather_goods"
            ]
          }
        },
        {
          "id": "parent_company",
          "name": "parent_company",
          "type": "text",
          "system": false,
          "required": false,
          "options": {
            "min": 0,
            "max": 255
          }
        },
        {
          "id": "headquarters",
          "name": "headquarters",
          "type": "text",
          "system": false,
          "required": false,
          "options": {
            "min": 0,
            "max": 255
          }
        }
      ],
      "listRule": "",
      "viewRule": "",
      "createRule": "",
      "updateRule": "",
      "deleteRule": "",
      "indexes": [
        "CREATE UNIQUE INDEX idx_brand_name ON brands (name)"
      ]
    },
    {
      "id": "tenures",
      "name": "tenures",
      "type": "base",
      "system": false,
      "schema": [
        {
          "id": "designer",
          "name": "designer",
          "type": "relation",
          "system": false,
          "required": true,
          "options": {
            "collectionId": "designers",
            "cascadeDelete": false,
            "maxSelect": 1,
            "displayFields": ["name"]
          }
        },
        {
          "id": "brand",
          "name": "brand",
          "type": "relation",
          "system": false,
          "required": true,
          "options": {
            "collectionId": "brands",
            "cascadeDelete": false,
            "maxSelect": 1,
            "displayFields": ["name"]
          }
        },
        {
          "id": "role",
          "name": "role",
          "type": "text",
          "system": false,
          "required": true,
          "options": {
            "min": 1,
            "max": 255
          }
        },
        {
          "id": "department",
          "name": "department",
          "type": "select",
          "system": false,
          "required": false,
          "options": {
            "values": [
              "Jewelry",
              "Watches",
              "Ready-to-Wear",
              "Accessories",
              "Leather Goods",
              "Menswear",
              "Womenswear",
              "Haute Couture",
              "All Departments"
            ]
          }
        },
        {
          "id": "start_year",
          "name": "start_year",
          "type": "number",
          "system": false,
          "required": false,
          "options": {
            "min": 1800,
            "max": null
          }
        },
        {
          "id": "end_year",
          "name": "end_year",
          "type": "number",
          "system": false,
          "required": false,
          "options": {
            "min": 1800,
            "max": null
          }
        },
        {
          "id": "is_current_role",
          "name": "is_current_role",
          "type": "bool",
          "system": false,
          "required": false
        }
      ],
      "listRule": "",
      "viewRule": "",
      "createRule": "",
      "updateRule": "",
      "deleteRule": "",
      "indexes": [
        "CREATE INDEX idx_tenure_designer ON tenures (designer)",
        "CREATE INDEX idx_tenure_brand ON tenures (brand)",
        "CREATE UNIQUE INDEX idx_unique_tenure ON tenures (designer, brand, role, start_year)"
      ]
    },
    {
      "id": "relationships",
      "name": "relationships",
      "type": "base",
      "system": false,
      "schema": [
        {
          "id": "source_designer",
          "name": "source_designer",
          "type": "relation",
          "system": false,
          "required": true,
          "options": {
            "collectionId": "designers",
            "cascadeDelete": false,
            "maxSelect": 1,
            "displayFields": ["name"]
          }
        },
        {
          "id": "target_designer",
          "name": "target_designer",
          "type": "relation",
          "system": false,
          "required": true,
          "options": {
            "collectionId": "designers",
            "cascadeDelete": false,
            "maxSelect": 1,
            "displayFields": ["name"]
          }
        },
        {
          "id": "brand",
          "name": "brand",
          "type": "relation",
          "system": false,
          "required": true,
          "options": {
            "collectionId": "brands",
            "cascadeDelete": false,
            "maxSelect": 1,
            "displayFields": ["name"]
          }
        },
        {
          "id": "type",
          "name": "type",
          "type": "select",
          "system": false,
          "required": true,
          "options": {
            "values": [
              "mentorship",
              "succession",
              "collaboration",
              "familial"
            ]
          }
        },
        {
          "id": "start_year",
          "name": "start_year",
          "type": "number",
          "system": false,
          "required": false,
          "options": {
            "min": 1800,
            "max": null
          }
        },
        {
          "id": "end_year",
          "name": "end_year",
          "type": "number",
          "system": false,
          "required": false,
          "options": {
            "min": 1800,
            "max": null
          }
        },
        {
          "id": "description",
          "name": "description",
          "type": "text",
          "system": false,
          "required": false,
          "options": {
            "min": 0,
            "max": 1000
          }
        },
        {
          "id": "impact",
          "name": "impact",
          "type": "text",
          "system": false,
          "required": false,
          "options": {
            "min": 0,
            "max": 1000
          }
        },
        {
          "id": "collaboration_projects",
          "name": "collaboration_projects",
          "type": "json",
          "system": false,
          "required": false
        }
      ],
      "listRule": "",
      "viewRule": "",
      "createRule": "",
      "updateRule": "",
      "deleteRule": "",
      "indexes": [
        "CREATE INDEX idx_relationship_source ON relationships (source_designer)",
        "CREATE INDEX idx_relationship_target ON relationships (target_designer)",
        "CREATE INDEX idx_relationship_brand ON relationships (brand)",
        "CREATE UNIQUE INDEX idx_unique_relationship ON relationships (source_designer, target_designer, brand, type)"
      ]
    }
  ]
}
