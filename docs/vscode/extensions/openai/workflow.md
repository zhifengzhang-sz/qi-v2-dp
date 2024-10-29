Building a Visual Studio Code (VSCode) extension to communicate with OpenAI's API involves several steps, from setting up the development environment to implementing the functionality you described. Here's a step-by-step guide to help you achieve your objectives:

### Step 1: Set Up Your Development Environment

1. **Install Node.js and npm:**
   - Node.js and npm (Node Package Manager) are essential as they allow you to install and manage the dependencies for your extension.

2. **Install Visual Studio Code:**
   - Ensure you have the latest version of VSCode installed.

3. **Install Yeoman and the VSCode Extension Generator:**
   - Use Yeoman, a scaffolding tool, to generate the VSCode extension template. Install it with:
     ```bash
     npm install -g yo generator-code
     ```

4. **Generate a New Extension:**
   - Use Yeoman to scaffold a new VSCode extension:
     ```bash
     yo code
     ```
   - Choose "New Extension (TypeScript)" to start with TypeScript, which is a good option for type safety and better tooling.

### Step 2: Implement Chat in the Sidebar

1. **Modify `package.json`:**
   - Define a new view container and view for your chat panel.
   ```json
   "contributes": {
     "viewsContainers": {
       "activitybar": [
         {
           "id": "openai",
           "title": "OpenAI",
           "icon": "resources/icon.png"
         }
       ]
     },
     "views": {
       "openai": [
         {
           "id": "openaiChat",
           "name": "Chat with OpenAI"
         }
       ]
     }
   }
   ```

2. **Create a Webview or Custom Editor:**
   - Use a `WebviewPanel` to display a custom HTML-based UI for the chat. This can include a text area for input and an area to display chat history.

3. **Set Up the Communication with OpenAI:**
   - Install OpenAI's Node.js client SDK.
   ```bash
   npm install openai
   ```
   - Use the SDK to send requests to the OpenAI API from within your extension.
   - Store your OpenAI API key securely, preferably using environment variables or VSCode's secret storage.

4. **Handle User Input:**
   - Create commands or callbacks to handle user input from the sidebar and send this to OpenAI's API, then display the response in the chat window.

### Step 3: Implement File Dropping Capability

1. **Drag-and-Drop Events:**
   - Use HTML5 drag-and-drop API within your webview to handle file drops.
   - Parse the dropped file content in JavaScript and send it as input in your conversations.

2. **Send File Content to OpenAI:**
   - After parsing the file, format its content (if needed) and include it alongside regular chat inputs to OpenAI's API.

### Step 4: Output Project Structure

1. **Access File System:**
   - Use VSCode's `vscode.workspace` API to access the project's file structure.
   - You might create a new command that retrieves and formats this structure as a string or JSON object.

2. **Display or Utilize in Chat:**
   - Format the structure in a readable way and, if possible, send this to OpenAI with a prompt asking for analysis or suggestions, then display the structured output within the chat.

### Step 5: Testing and Packaging

1. **Test Your Extension:**
   - Use VSCode’s debugging features to test your extension locally.
   - Debug any JavaScript or network issues to ensure smooth interaction with OpenAI.

2. **Package and Publish:**
   - Once satisfied, package your extension using `vsce`, the Visual Studio Code Extensions CLI:
     ```bash
     npm install -g vsce
     vsce package
     ```
   - Follow the guidelines on the VSCode Marketplace to publish your extension for others to use.

### Additional Considerations

- **Error Handling and Security:**
  - Ensure robust error handling, especially for network requests or API call errors.
  - Consider user privacy and data security, particularly when handling files and API keys.
  
- **UI/UX:**
  - Design your UI for ease of use, making sure users can easily input chat messages and drop files.

Building this extension combines backend logic (handling OpenAI API calls) with frontend development (UI implementation in VSCode's webview). Be sure to reference the [VSCode API documentation](https://code.visualstudio.com/api) and [OpenAI API documentation](https://beta.openai.com/docs/) for more detailed guidance.