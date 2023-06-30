# StraboMicro Web Viewer
The StraboMicro Web Viewer is a simple web application that allows the hosting and browsing of StraboMicro SMZ files on any platform. The only requirement is a web server capable of delivering web content.

## How it works:

 1. Github repo files are placed in a location served by a web server.
 2. Uncompressed SMZ folders are placed in the smzFiles directory:<br>
 ![How to Add Projects](https://strabospot.org/assets/files/microViewerSShot.png)<br>
 SMZ files can be uncompressed by changing the .smz extension to .zip and 
 expanding with your preferred zip archive utility.
 3. Project can then be viewed by visiting
    http://somehost.com/microViewFolder/view.html?p=12345678901234
    where 12345678901234 is the id of the project and also the folder
    name in smzFiles.

## Configuration Options

There are configuration options located in the file assets/microView_config.js:

 - **smzFilesLocation**: This option lets you change where the StraboMicro  
   Web Viewer looks for project folders. The default value is   
   `./smzFiles/`. Please remember that this location is regulated by CORS 
   rules and cross-domain requests will likely not work.
 - **showHeader**:    This option determines if the top header should be shown. The    default value is true.
 - **showFooter**: This option determines if the bottom footer should be shown. The default value is true.

## Caveats

The StraboMicro Web Viewer will only work with SMZ projects saved by StraboMicro version 1.0.4 or later. Previous versions of StraboMicro do not create the necessary image folders needed by StraboMicro Web Viewer.

## Questions?

Please direct all questions regarding The StraboMicro Web Viewer to:
<p align="center">
  Jason Ash (jasonash@ku.edu)
</p>