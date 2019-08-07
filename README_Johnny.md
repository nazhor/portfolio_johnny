# Tutorial

## Setting the files
The most important files (and the only ones you are going to use) are:

* Config.toml: This is the main file, all the configuration and common texts have to be setted here. As you can see it's already prepare for english/spanish.
* Data/en/items.toml: This is the file with the information about every single portfolio item. You can add as many as you want as long as you set every property with a valid value. In the example file you can find a description for every field.
* Data/en/items.toml: The spanish version of the items, you only have to replace the text fields with the spanish version but you can also change the image/video url if you want.

## Testing the web before upload
For see the changes in realtime to have to:
1. Open a console. Search for cmd in windows start menu.
2. Go to the current portfolio folder, for example: cd D:\Projects\Hugo\portfolio_johnny
3. Execute the command: hugo server -D
4. Go to http://localhost:1313 with a browser

## Get the items ready
Once you have the files updated you have to build the content in order to get the "static" files that github pages need.
You only need the batch file named "Alfred.bat" but before you use it you have to open it with the notepad in order to set one variable: "destiny_folder". As the name says is the destiny folder were the files are going to be copied. This folder has to be the johnny-devv.github.io repository.

## Push the content to Github
With the files in the repository folder you only have to do the normal GIT procedure: Add -> Commit -> Push.
You can use the GIThub client.

## Done, you owe me a _couple_ of drinks