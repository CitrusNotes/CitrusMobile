# Backend Configuration

## Updating the `.env` File

To configure the backend application, you need to update the `backend/.env` file with your database credentials. Follow these steps:

1. **Locate the `.env` File**:
   - Navigate to the `backend` directory of your project.
   - You should find a file named `.env`. If it does not exist, it will be created automatically during the setup process.

2. **Open the `.env` File**:
   - Use a text editor of your choice to open the `backend/.env` file.

3. **Update Database Credentials**:
   - Find the line that starts with `DATABASE_URL`. It should look like this:
     ```
     DATABASE_URL=mysql://user:password@localhost:3306/citrusnotes
     ```
   - Replace `user`, `password`, and `localhost:3306/citrusnotes` with your actual database username, password, host, and database name. For example:
     ```
     DATABASE_URL=mysql://myuser:mypassword@myhost:3306/mydatabase
     ```

4. **Save the Changes**:
   - After updating the credentials, save the file and close the text editor.

5. **Restart the Backend Server**:
   - If your backend server is running, restart it to apply the changes.

### Important Notes
- Ensure that your database server is running and accessible from your application.
- Keep your credentials secure and do not share them publicly.