# Backend Configuration

## Updating the `.env` File

To configure the backend application, you need to update the `backend/.env` file with your MongoDB credentials. Follow these steps:

1. **Locate the `.env` File**:
   - Navigate to the `backend` directory of your project.
   - You should find a file named `.env`. If it does not exist, it will be created automatically during the setup process.

2. **Open the `.env` File**:
   - Use a text editor of your choice to open the `backend/.env` file.

3. **Update MongoDB Credentials**:
   - Find the line that starts with `MONGODB_URL`. It should look like this:
     ```
     MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>`, `<password>`, and `<cluster>` with your actual MongoDB Atlas credentials.
   - For local MongoDB, use:
     ```
     MONGODB_URL=mongodb://localhost:27017/citrusnotes
     ```

4. **Save the Changes**:
   - After updating the credentials, save the file and close the text editor.

5. **Restart the Backend Server**:
   - If your backend server is running, restart it to apply the changes.

### Important Notes
- Ensure that your MongoDB server is running and accessible from your application.
- Keep your credentials secure and do not share them publicly.
- For MongoDB Atlas, make sure your IP address is whitelisted in the network access settings.