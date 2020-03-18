# v1.0.0
* Initial Release

# v1.0.1
* Fix regex injection where special characters would be used in a database search. This also fixes an issue where some search results have no results (IE: "Safari Plus (Cepheiless)").
* Bot is functional.

# v1.0.2
* Discord functionality changed. The user now picks the package they want (if there are multiple results) and then the latest version is automatically calculated. This replaces picking which version is used for the first result that matches the criteria.
* Updates CyRepo to fix a bug where the displayName could be undefined.
* Updated CyRepo to fix a bug where files were not being written to the ``node_modules/CyRepo/temp`` folder. Create a folder named temp in the root of this repo.