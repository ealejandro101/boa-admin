<!DOCTYPE html>
<html xmlns:app>
	<head>
		<title></title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
		<link rel="icon" type="image/x-png" href="APP_PLUGINS_FOLDER/gui.ajax/res/themes/vision/images/html-folder.png">
		<link rel="stylesheet" type="text/css" href="APP_PLUGINS_FOLDER/gui.ajax/res/themes/vision/css/allz.css">
        <link rel="stylesheet" href="APP_PLUGINS_FOLDER/gui.ajax/res/themes/vision/css/font-awesome.css"/>
        <link rel="stylesheet" href="APP_PLUGINS_FOLDER/gui.ajax/res/themes/vision/css/media.css"/>
		<style type="text/css">
			.widget_title{
                font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
                font-size: 30px;
                font-weight: normal;
                padding: 10px 0 0 5px;
                color: rgb(111,123,136);
                background-image: url('APP_PLUGINS_FOLDER/gui.ajax/AppLogo250.png');
                background-repeat: no-repeat;
                background-position: right 9px;
                background-size: 170px;
                margin-right: 5px;
            }
			#shared_folder{
				width:100%;
				text-align:left;
				/* THESE ONE ARE IMPORTANT */
				overflow:hidden;
				position:relative;
			}
            .action_bar{
                background-color: #ffffff;
            }
            .action_bar > .toolbarGroup{
                height: auto;
            }
            div.separator{
                border-left-width: 0;
            }
            #display_toolbar{
                margin-top: 3px;
                margin-right: 3px;
            }
            div.detailed div.FL-inlineToolbar{
                margin-top: -2px;
            }
            div.detailed div.FL-inlineToolbar div.toolbarGroup {
                margin-left: -8px;
                min-width: 0;
            }
            div#inline_toolbar a {
                font-size: 11px;
                border: 1px solid rgba(111, 123, 136, 0.42);
                font-size: 11px;
                display: inline-block;
                color: rgb(111, 123, 136);
                border-radius: 3px;
                padding: 0 7px;
                margin-top: 4px;
                margin-bottom: 4px;
                background-color: rgba(111, 123, 136, 0.09);
                box-shadow: inset 1px 1px 1px white;
            }
            .appNodeProvider span.actionbar_button_label {
                display: none;
            }
            .appNodeProvider.detailed span.actionbar_button_label {
                display: inline-block;
            }
            tr div.FL-inlineToolbar {
                margin-left: 15px;
            }
            span.list_selectable_span div#inline_toolbar a
            {
                margin-top: 0;
                padding: 3px 5px;
                position: relative;
                top: -2px;
            }
            div.appNodeProvider:not(.detailed) div#inline_toolbar a
            {
                padding: 3px 5px;
            }
            div.appNodeProvider:not(.detailed) .toolbarGroup {
                position: absolute;
                top: 1px;
                right: 1px;
            }
            #element_overlay{
                top:0 !important; left:0 !important;
            }
            body.preloged_user a#logout_button{
                display: none;
            }
		</style>
		<script language="javascript" type="text/javascript" src="APP_PLUGINS_FOLDER/gui.ajax/res/js/app_boot.js"></script>
		<script type="text/javascript">
			var app, MessageHash={};
			var startParameters = {
				"BOOTER_URL":"APP_PATH_TO_ROOT/index_shared.php?get_action=get_boot_conf&goto=APP_START_REPOSITORY&minisite_session=true",
				"EXT_REP":"\/", 
				"MAIN_ELEMENT":"shared_folder",
				"SERVER_PREFIX_URI": "APP_PATH_TO_ROOT/"
			};
            document.observe("app:before_gui_load", function(e){
               app.currentThemeUsesIconFonts = true;
               document.documentElement.className += " app_theme_vision";
           });
			window._bootstrap = new AppBootstrap(startParameters);
            window._minisite = true;
            window.onunload = function(){
                if(app) app.actionBar.fireAction("logout");
            }
            document.observe("dom:loaded", function(){
                var cookieEnabled=(navigator.cookieEnabled)? true : false
                   if (typeof navigator.cookieEnabled=="undefined" && !cookieEnabled){
                       document.cookie="testcookie";
                       cookieEnabled=(document.cookie.indexOf("testcookie")!=-1)? true : false;
                   }
                   if(!cookieEnabled){
                       alert('APP_MESSAGE[share_center.76]');
                   }
            });
		</script>
        <noscript><h2>APP_MESSAGE[share_center.77]</h2></noscript>
	</head>

	<body marginheight="0" marginwidth="0" leftmargin="0" topmargin="0" class="APP_PRELOGED_USER">
        <div class="widget_title">APP_REPOSITORY_LABEL</div>
        <div id="shared_folder" appClass="AppPane" appOptions='{"fit":"height", "fitParent":"window"}'></div>
	</body>
</html>