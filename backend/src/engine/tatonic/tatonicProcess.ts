import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";

export async function compileLatexWithTectonic(latex: string): Promise<Buffer> {
    const dir = await fs.mkdtemp("latex-");
    const texPath = path.join(dir, "resume.tex");

    await fs.writeFile(texPath, latex);

    await new Promise((resolve, reject) => {
        execFile(
            "C:\\Drive-C\\Agent_Manger\\ai_resume_creator\\backend\\src\\engine\\tatonic\\tectonic.exe",
            ["resume.tex", "--print"],
            { cwd: dir },
            (err) => (err ? reject(err) : resolve(null))
        );
    });

    return fs.readFile(path.join(dir, "resume.pdf"));
}
