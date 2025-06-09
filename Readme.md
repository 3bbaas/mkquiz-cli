# mkquiz CLI

`mkquiz` is a command-line tool to manage quizzes for the [Quizzez static project].

 
![mkquiz](https://i.ibb.co/Y4SpYXJL/logo.png) 
 
## 📦 Installation

```bash
npm install -g @3bbas/mkquiz
```

## 🚀 Usage

```bash
mkquiz [command]
```

## 💡 Available Commands

| Command        | Alias | Description                                                  |
|----------------|-------|--------------------------------------------------------------|
| `mkquiz`       |       | Show the welcome banner and intro message                    |
| `config`       |       | Set the Quizzez project configuration (path & template)      |
| `add`          |       | Add a new quiz (interactive prompt for details)              |
| `remove`       | `rmv` | Remove an existing quiz or subject folder                    |
| `revive`       |       | Rebuild the entire quizzes folder structure                  |
| `fix-paths`    |       | Fix paths inside JSON files to match web format              |

## 🧪 Example

```bash
mkquiz config         # Setup your project configuration
mkquiz add            # Add a new quiz via prompts
mkquiz rmv -q quiz1   # Remove a specific quiz
mkquiz rmv -s subject1 # Remove a whole subject
mkquiz revive         # Regenerate quizzes structure from JSONs
```

## 🛠 Maintained By

**Author**: [3bbas](https://github.com/3bbaas)  
**Based on**: ma-helper Quizzez project
