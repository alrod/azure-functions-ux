using System;
using System.IO;
using Deploy.DeploymentSdk;
using Deploy.Extensions;
using Deploy.Helpers;

namespace Deploy
{
    class Program
    {
        static void Main(string[] args)
        {
            // const string deploymentSource = @"D:\home\site\repository";
            // const string deploymentTarget = @"D:\home\site\wwwroot";
            // var deploymentTempTarget = GetTempFolder();
            // const string toolsDirectory = @"D:\home\tools";
            // const string ng = @"node_modules\.bin\ng";
            // var yarn = Path.Combine(toolsDirectory, "yarn");
            // var msBuild = @"%ProgramFiles(x86)%\MSBuild\14.0\Bin\MSBuild.exe".DoubleQuote();
            // var assets = Path.Combine(deploymentSource, @"AzureFunctions.AngularClient\src\assets");

            // TryCreateDirectory(deploymentTempTarget);
            // TryCreateDirectory($@"{deploymentTempTarget}\ng-min");
            // TryCreateDirectory($@"{deploymentTempTarget}\ng-full");

            // DeploySdk
            //     .StandardDeployment
            //     .Call("npm", $"config set prefix {toolsDirectory}")
            //     .Call("npm", "install -g yarn")
            //     .Call("nuget", $"restore {deploymentSource}\\AzureFunctions.sln")
            //     .Call(msBuild, $@"{deploymentSource}\AzureFunctions\AzureFunctions.csproj /nologo /verbosity:m /t:Build /t:pipelinePreDeployCopyAllFilesToOneFolder /p:_PackageTempDir=""%DEPLOYMENT_TEMP%"";AutoParameterizationWebConfigConnectionStrings=false;Configuration=Release;UseSharedCompilation=false  /p:DeleteExistingFiles=False /p:SolutionDir=""{deploymentSource}\.\\"" %SCM_BUILD_ARGS%")
            //     .KuduSync()
            //     .ChangeDirectory($@"{deploymentSource}\AzureFunctions.AngularClient")
            //     .Call(yarn, "install", tries: 2)
            //     .Call("npm", "rebuild node-sass")
            //     .CleanAngularArtifacts()
            //     .Call(ng, $"build --progress false --prod --environment=prod --output-path=\"{deploymentTempTarget}\\ng-min\"", tries: 2)
            //     .Call(ng, $"build --progress false --output-path=\"{deploymentTempTarget}\\ng-full\"", tries: 2)
            //     .CopyDirectory($@"{deploymentTempTarget}\ng-min", $@"{deploymentTarget}\ng-min")
            //     .CopyDirectory($@"{deploymentTempTarget}\ng-full", $@"{deploymentTarget}\ng-full")
            //     .UpdateCshtml()
            //     .SetupTemplatesWebJob()
            //     .UpdateBuildTxt()
            //     .CopyFile($@"{assets}\googlecdaac16e0f037ee3.html", $@"{deploymentTarget}\googlecdaac16e0f037ee3.html")
            //     .CopyDirectory($@"{assets}\schemas", $@"{deploymentTarget}\schemas")
            //     .OnFail(EmailHelpers.EmailFailedRun)
            //     .OnSuccess(EmailHelpers.EmailSuccessfulRun)
            //     .Run();

            const string deploymentSource = @"D:\home\site\repository";
            const string deploymentTarget = @"D:\home\site\wwwroot";
            var deploymentTempTarget = GetTempFolder();
            const string toolsDirectory = @"D:\home\tools";
            const string ng = @"node_modules\.bin\ng";
            var yarn = Path.Combine(toolsDirectory, "yarn");
            var gulp = Path.Combine(toolsDirectory, "gulp");
            //var tsc =  @"node_modules\.bin\tsc";
            var assets = Path.Combine(deploymentSource, @"AzureFunctions.AngularClient\src\assets");

            DeploySdk
                .StandardDeployment
                .Call("npm", $"config set prefix {toolsDirectory}")
                .Call("npm", "install -g yarn")
                .Call("npm", "install -g gulp")
                .CopyDirectory($@"{deploymentSource}", $@"{deploymentTempTarget}\Repo")
                .ChangeDirectory($@"{deploymentTempTarget}\Repo\server")
                .Call(yarn, "install", tries: 2)
                .Call(gulp, "build-production", tries: 2) 
                .CopyDirectory($@"{deploymentTempTarget}\Repo\server\build",  $@"{deploymentTempTarget}\bin")
                .ChangeDirectory($@"{deploymentTempTarget}\Repo\AzureFunctions.AngularClient")
                .Call(yarn, "install", tries: 2)
                .Call("npm", "rebuild node-sass")
                .CleanAngularArtifacts()
                .Call(ng, $"build --progress false --prod --environment=prod --output-path=\"{deploymentTempTarget}\\bin\\ng-min\"", tries: 2)
                .Call(ng, $"build --progress false --output-path=\"{deploymentTempTarget}\\bin\\ng-full\"", tries: 2)
                .CopyDirectory($@"{deploymentTempTarget}\bin", $@"{deploymentTarget}")
                .CopyFile($@"{assets}\googlecdaac16e0f037ee3.html", $@"{deploymentTarget}\googlecdaac16e0f037ee3.html")
                .CopyDirectory($@"{assets}\schemas", $@"{deploymentTarget}\schemas")
                .ChangeDirectory(deploymentTarget)
                .Call(yarn, "install --production", tries: 2)
                .Run();
        }

        static bool TryCreateDirectory(string path)
        {
            try
            {
                if (Directory.Exists(path))
                {
                    Directory.Delete(path, true);
                }

                Directory.CreateDirectory(path);
                return true;
            }
            catch
            {
                return false;
            }
        }

        static string GetTempFolder()
        {
            var random = Path.GetFileNameWithoutExtension(Path.GetTempFileName());
            return Path.Combine(Path.GetTempPath(), random);
        }
    }
}
