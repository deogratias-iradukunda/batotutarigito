# Security Specification - BatoTutariGito

## Data Invariants
1. Students can only read their own profile, announcements, and comments related to them (sent, received, or via email match).
2. Shares investments belong to a specific user and can only be listed by that user or an admin.
3. Announcements are public but only admins can write them.
4. Admins have full access to all collections.

## The Dirty Dozen (Malicious Payloads)
1. **Identity Spoofing**: Attempt to create a share with another user's `userId`.
2. **PII Leak**: Attempt to list all students' private data as a non-admin.
3. **Ghost Update**: Attempt to update a cow's value as a student.
4. **Email Spoof**: Attempt to read private comments by seting `email` in the query to an admin's email while not being that admin.
5. **Collection Wipe**: Attempt to delete all announcements as a guest.
6. **Role Escalation**: Attempt to create a document in `/admins/` as a student.
7. **Orphaned Record**: Create a comment without a valid sender or receiver.
8. **Resource Poisoning**: Use a 1MB string as a document ID in `/comments/`.
9. **State Shortcut**: Move a student from 'active' to 'graduated' without being an admin.
10. **Query Scraping**: Attempt a blanket `list` on `comments` without filters.
11. **Timestamp Manipulation**: Set a backdated `createdAt` when creating a comment.
12. **Immortality Breach**: Attempt to change `userId` in an existing `share` document.

## Rule Hardening Strategy
- Every `allow list` and `allow get` for private collections (shares, comments) will use `resource.data` and `request.auth.uid` or `request.auth.token.email`.
- `isValidId()` helper will be used for all specific document matches.
- `isAdmin()` will be a combination of static email check and dynamic database lookup.
- `allow read: if true` will be limited to truly public collections (announcements) and potentially students (limited public profile).
