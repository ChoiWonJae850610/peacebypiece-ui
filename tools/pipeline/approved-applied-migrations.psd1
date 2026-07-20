@{
    Alpha42Migration012 = @{
        Status = "approved-already-applied-pending-commit"
        VerificationProfile = "automation-infrastructure"
        ExpectedAppVersions = @("2.0.0-alpha.41", "2.0.0-alpha.42")
        RuntimeEnvironment = "development"
        MigrationPath = "db/v2/migrations/012_v2_document_access_token_purpose.sql"
        MigrationSha256 = "400d644c7151d9b5282a2d7487367a5acda5f96e896ad2c6f37432de883a52e5"
        TargetFingerprint = "01e5dcc7fea3"
        ExpectedLedgerCount = 12
        ExpectedApplyCount = 1
        ApplyMarker = "ALPHA42_MIGRATION_012_APPLY_PASS"
        MigrationFiles = @(
            @{ Name = "001_v2_tenant_document_number_foundation.sql"; Sha256 = "b53c441a0b378363d860d31bd863eba6ad0255d4135130b9619b1984a9d28953" }
            @{ Name = "002_v2_work_orders_revisions.sql"; Sha256 = "6d28d2b2a0ada94a86d5d453cbcf0b0c95e0e054662c55c346d74eebff87705b" }
            @{ Name = "003_v2_revision_content.sql"; Sha256 = "babe21d20527f9b3a4ea0c15e24065a9eb8e8c53a3bfa605cf4a6717d749965f" }
            @{ Name = "004_v2_assets_revision_linkage.sql"; Sha256 = "e04ab992de75d02d0bce6ef38a3f129e25c2b26a0406779ec0d5e8b53aa72509" }
            @{ Name = "005_v2_documents_access_events.sql"; Sha256 = "26a04f5bbfb8eea29a72411cf7a20b1d378d8603eb290c6c7b8559c9121190c7" }
            @{ Name = "006_v2_deferred_constraints_indexes.sql"; Sha256 = "8befc6f5ec9ffdf3dece2a8dfa9e2166a30a30e46dc9905dc1a119ada56caa01" }
            @{ Name = "007_v2_work_order_list_material_lookup_index.sql"; Sha256 = "c602e706aaad0d4ea70a2018e37cdfd85ddb53aa2cec51c90967f18d32ef895c" }
            @{ Name = "008_v2_tenant_document_number_settings_function.sql"; Sha256 = "11be99d82fdd49041320b796d2c54e4f463e1572431b3a925ed7e7be619d0d32" }
            @{ Name = "009_v2_workorder_factory_instruction_fields.sql"; Sha256 = "bb2f505eecbad87246360d42f5bdcd24b20f4b9f056a4df6afe5346e673f3af9" }
            @{ Name = "010_v2_generated_document_receipt_link.sql"; Sha256 = "d75dac55a0536210513a1fb00db2513bc9249a7363d66dcd5d4c0cab24c6e350" }
            @{ Name = "011_v2_document_access_viewer_functions.sql"; Sha256 = "8cb34bcb819531043bcda26f89fa7f70ad02e1c4b134a30407c83ff7e871f251" }
            @{ Name = "012_v2_document_access_token_purpose.sql"; Sha256 = "400d644c7151d9b5282a2d7487367a5acda5f96e896ad2c6f37432de883a52e5" }
        )
        ApplyEvidence = @{
            FileName = "alpha42-migration-012-apply-20260715-074828.txt"
            Sha256 = "ad8f2de3bc19455d3e840ce86115141f7bae2e06b40fce4745cee5ffd2640beb"
            RequiredMarkers = @(
                "ALPHA42_MIGRATION_012_APPLY_PASS"
                "Ledger: 11/11 -> 12/12"
                "data/R2/production mutation 0"
            )
        }
        PostApplyEvidence = @{
            FileName = "alpha42-migration-012-post-audit-20260715-074845.txt"
            Sha256 = "edd9f154fcf9ff24ad78f5ac90eeaa9d0264828154b4798ea6420ec50327831d"
            RequiredMarkers = @(
                "ALPHA42_MIGRATION_012_READ_ONLY_AUDIT_PASS"
                "Ledger: 12/12"
                "manual_share/embedded_qr: 2/0"
            )
        }
    }
    Alpha51Migration013 = @{
        Status = "approved-already-applied-pending-commit"
        VerificationProfile = "automation-infrastructure"
        ExpectedAppVersions = @("2.0.0-alpha.51")
        RuntimeEnvironment = "development"
        MigrationPath = "db/v2/migrations/013_v2_material_line_archive_lifecycle.sql"
        MigrationSha256 = "fe7825c4a7002a60d1404981214fe4ed1927e5e950fd2654ddef772c08547c9c"
        TargetFingerprint = "01e5dcc7fea3"
        ExpectedLedgerCount = 13
        ExpectedApplyCount = 1
        ApplyMarker = "ALPHA51_MIGRATION_013_APPLY_PASS"
        MigrationFiles = @(
            @{ Name = "001_v2_tenant_document_number_foundation.sql"; Sha256 = "b53c441a0b378363d860d31bd863eba6ad0255d4135130b9619b1984a9d28953" }
            @{ Name = "002_v2_work_orders_revisions.sql"; Sha256 = "6d28d2b2a0ada94a86d5d453cbcf0b0c95e0e054662c55c346d74eebff87705b" }
            @{ Name = "003_v2_revision_content.sql"; Sha256 = "babe21d20527f9b3a4ea0c15e24065a9eb8e8c53a3bfa605cf4a6717d749965f" }
            @{ Name = "004_v2_assets_revision_linkage.sql"; Sha256 = "e04ab992de75d02d0bce6ef38a3f129e25c2b26a0406779ec0d5e8b53aa72509" }
            @{ Name = "005_v2_documents_access_events.sql"; Sha256 = "26a04f5bbfb8eea29a72411cf7a20b1d378d8603eb290c6c7b8559c9121190c7" }
            @{ Name = "006_v2_deferred_constraints_indexes.sql"; Sha256 = "8befc6f5ec9ffdf3dece2a8dfa9e2166a30a30e46dc9905dc1a119ada56caa01" }
            @{ Name = "007_v2_work_order_list_material_lookup_index.sql"; Sha256 = "c602e706aaad0d4ea70a2018e37cdfd85ddb53aa2cec51c90967f18d32ef895c" }
            @{ Name = "008_v2_tenant_document_number_settings_function.sql"; Sha256 = "11be99d82fdd49041320b796d2c54e4f463e1572431b3a925ed7e7be619d0d32" }
            @{ Name = "009_v2_workorder_factory_instruction_fields.sql"; Sha256 = "bb2f505eecbad87246360d42f5bdcd24b20f4b9f056a4df6afe5346e673f3af9" }
            @{ Name = "010_v2_generated_document_receipt_link.sql"; Sha256 = "d75dac55a0536210513a1fb00db2513bc9249a7363d66dcd5d4c0cab24c6e350" }
            @{ Name = "011_v2_document_access_viewer_functions.sql"; Sha256 = "8cb34bcb819531043bcda26f89fa7f70ad02e1c4b134a30407c83ff7e871f251" }
            @{ Name = "012_v2_document_access_token_purpose.sql"; Sha256 = "400d644c7151d9b5282a2d7487367a5acda5f96e896ad2c6f37432de883a52e5" }
            @{ Name = "013_v2_material_line_archive_lifecycle.sql"; Sha256 = "fe7825c4a7002a60d1404981214fe4ed1927e5e950fd2654ddef772c08547c9c" }
        )
        ApplyEvidence = @{
            FileName = "alpha51-migration-013-apply-20260720-102946.txt"
            Sha256 = "4aebf5c54027aa0635ff4dfff12f56c29ddd8ebfb5c27e78092e728c18d1b026"
            RequiredMarkers = @(
                "ALPHA51_MIGRATION_013_APPLY_PASS"
                "Ledger: 12/12 -> 13/13"
                "business rows 0"
            )
        }
        PostApplyEvidence = @{
            FileName = "alpha51-migration-013-post-audit-20260720-102959.txt"
            Sha256 = "6c721df27c5004eafe5d0bbdbe11efcbdd332227e5d57fa8fc1609f84e10b1b3"
            RequiredMarkers = @(
                "ALPHA51_MIGRATION_013_READ_ONLY_AUDIT_PASS"
                "Ledger: 13/13"
                "archived existing rows 0"
            )
        }
    }
}
