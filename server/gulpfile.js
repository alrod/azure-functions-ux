const gulp = require('gulp');
const resx2 = require('gulp-resx2');
const rename = require('gulp-rename');
const gulpMerge = require('merge-stream');
const jeditor = require('gulp-json-editor');
const runSequence = require('run-sequence');
const fs = require('fs');
const path = require('path');
const merge = require('gulp-merge-json');
const del = require('del');

/********
*   This is the task that is actually run in the cli, it will run the other tasks in the appropriate order
*/
gulp.task('build-resources', function(cb) {
    runSequence('resources-convert', 'resources-build', 'resources-combine', 'resources-clean', cb);
});

/********
*   In the process of building resources, intermediate folders are created for processing, this cleans them up at the end of the process
*/
gulp.task('resources-clean', function() {
    return del(['resources-convert', 'templateResoureces-convert', 'resources-build', 'templateresources-build']);
});

/********
*   This task takes the Resource Resx files from both templates folder and Portal Resources Folder and converts them to json, it drops them into a intermediate 'convert' folder.
*   Also it will change the file name format to Resources.<language code>.json
*/
gulp.task('resources-convert', function() {
    const portalResourceStream = gulp
        .src(['../AzureFunctions/ResourcesPortal/**/Resources.resx'])
        .pipe(resx2())
        .pipe(
            rename(function(p) {
                const language = p.dirname.split(path.sep)[0];
                if (!!language && language !== '.') {
                    p.basename = 'Resources.' + language;
                }
                p.dirname = '.';
                p.extname = '.json';
            })
        )
        .pipe(gulp.dest('resources-convert'));

    const templateResourceStream = gulp
        .src(['templates/**/Resources/**/Resources.resx'])
        .pipe(resx2())
        .pipe(
            rename(function(p) {
                const parts = p.dirname.split(path.sep);
                const version = parts[0];

                const language = parts.length > 2 ? parts[parts.length - 2] : null;
                if (!!language && language !== '.') {
                    p.basename = 'Resources.' + language;
                }
                p.dirname = '.' + path.sep + version + path.sep;
                p.extname = '.json';
            })
        )
        .pipe(gulp.dest('templateResoureces-convert'));
    return gulpMerge(portalResourceStream, templateResourceStream);
});


/********
*   This is the task takes the output of the  convert task and formats the json to be in the format that gets sent back to the client by the API, it's easier to do this here than at the end
*/
gulp.task('resources-build', function() {
    const streams = [];
    streams.push(
        gulp
            .src(['resources-convert/**/Resources.*.json'])
            .pipe(
                jeditor(function(json) {
                    const enver = require(path.normalize('../server/resources-convert/Resources.json'));
                    const retVal = {
                        lang: json,
                        en: enver
                    };

                    return retVal;
                })
            )
            .pipe(gulp.dest('resources-build'))
    );

    streams.push(
        gulp
            .src(['resources-convert/Resources.json'])
            .pipe(
                jeditor(function(json) {
                    const retVal = {
                        en: json
                    };

                    return retVal;
                })
            )
            .pipe(gulp.dest('resources-build'))
    );

    //This fetches all version folders for templates and makes sure the appropriate action is done to each one
    const TemplateVersionDirectories = getSubDirectories('templateResoureces-convert');
    TemplateVersionDirectories.forEach(x => {
        streams.push(
            gulp
                .src('templateResoureces-convert/' + x + '/Resources.*.json')
                .pipe(
                    jeditor(
                        function(json) {
                            const enver = require(path.normalize('../server/templateResoureces-convert/' + x + '/Resources.json'));
                            const retVal = {
                                lang: json,
                                en: enver
                            };

                            return retVal;
                        }
                    )
                )
                .pipe(gulp.dest('templateresources-build/' + x))
        );

        streams.push(
            gulp
                .src('templateResoureces-convert/' + x + '/Resources.json')
                .pipe(
                    jeditor(
                        function(json) {
                            const retVal = {
                                en: json
                            };

                            return retVal;
                        }
                    )
                )
                .pipe(gulp.dest('templateresources-build/' + x))
        );
    });
    return gulpMerge(streams);
});

/*************
 * Resources Combining
 * https://stackoverflow.com/questions/46605923/gulp-merge-json-files-from-different-folders-while-keeping-folder-structure
 * 
 * This tasks goes through each template version folder and combines it with the corresponding portal resource file(matched by name) and deposits it into the /src/actions/resources folder for the API to consume.
 * It also builds a version which contains no version, mostly for development purposes
 * The end file name format is Resources.<language code>.<template version>.json for the template includes, for the default no template it'll be Resources.<language code>.json, also the english version will have no language code, it'll just be default
 */
const files = [];
const parentFolders = [];
let streams = [];
const baseNames = [];

gulp.task('resources-combine', function() {
    const TemplateVersionDirectories = getSubDirectories('templateresources-build');
    const s = [];
    TemplateVersionDirectories.forEach(x => {
        const folders = ['templateresources-build/' + x, 'resources-build'];
        getFiles(folders);
        makeStreams();

        streams.forEach(stream => {
            let fileName = path.basename(stream[stream.length - 1]);

            let dirName = path.dirname(stream[stream.length - 1]);
            dirName = dirName.substr(dirName.indexOf(path.sep));

            s.push(
                gulp
                    .src(stream)
                    .pipe(merge({ fileName: fileName }))
                    .pipe(
                        rename(function(p) {
                            p.basename += '.' + x;
                        })
                    )
                    .pipe(gulp.dest('src/actions/resources'))
            );
        });
    });

    //this is copying over files that have no template data, it's the final fallback resources if there are no templates, useful for development
    s.push(gulp.src('resources-build/*.json').pipe(gulp.dest('src/actions/resources')));

    return gulpMerge(s);
});

function getSubDirectories(folder) {
    if (!fs.existsSync(folder)) {
        return [];
    }
    const dir = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
    return dir(folder);
}

function getFiles(folders) {
    let possibleDirectory;

    folders.forEach(function(folder, index) {
        let tempFiles = fs.readdirSync('./' + folder);

        tempFiles.forEach(function(fileOrDirectory) {
            possibleDirectory = path.join(folder, fileOrDirectory);
            if (fs.lstatSync(possibleDirectory).isDirectory()) {
                getFiles([possibleDirectory]);
            } else {
                files.push(path.join(folder, fileOrDirectory));

                if (baseNames.indexOf(fileOrDirectory) === -1) {
                    baseNames.push(fileOrDirectory);
                }
            }
        });
    });
}

function makeStreams() {
    files.forEach(function(file) {
        let thisParentFolders = path.dirname(file).substr(file.indexOf(path.sep));

        if (parentFolders.indexOf(thisParentFolders) === -1) {
            parentFolders.push(thisParentFolders);
        }
    });

    parentFolders.forEach(function(folder) {
        let foldersFile = folder.substr(folder.indexOf(path.sep));

        baseNames.forEach(function(baseName) {
            streams.push(
                files.filter(function(file) {
                    return file.endsWith(path.join(foldersFile, baseName));
                })
            );
        });
    });
    streams = streams.filter(stream => stream.length >= 1);
}