Basic Coding Standard
=====================

This section of the standard comprises what should be considered the standard
coding elements that are required to ensure a high level of technical
interoperability between shared PHP code.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in [RFC 2119].


1. Overview
-----------

- Files MUST use only `<?php` and `<?=` tags.

- Files having only PHP code MUST have not ending tag ?>

- Files MUST use only UTF-8 without BOM for PHP code.

- Files SHOULD *either* declare symbols (classes, functions, constants, etc.)
  *or* cause side-effects (e.g. generate output, change .ini settings, etc.)
  but SHOULD NOT do both.

- Class names MUST be declared in `PascalCase` or `UpperCamelCase`.

- Class constants MUST be declared in all upper case with underscore separators `CLASS_CONSTANT`.

- Method names MUST be declared in `lowerCamelCase`.

- Spaces MUST NOT be added before starting parenthesis for method declaration and execution. An space MUST be added before starting parethesis of conditionals and bucles (if, for, foreach, while, catch, etc).

- Indentation MUST use 4 spaces (NO tabs). 


## 2. Files


### 2.1. PHP Tags

PHP code MUST use the long `<?php ?>` tags or the short-echo `<?= ?>` tags; it MUST NOT use the other tag variations.

### 2.2. Character Encoding

PHP code MUST use only UTF-8 without BOM.

### 2.3. Indentation

Use an indent of 4 spaces with no tab characters. Editors should be configured to treat tabs as spaces in order to prevent injection of new tab characters into the source code. 

Don't indent the main script level.

### 2.4. Side Effects

A file SHOULD declare new symbols (classes, functions, constants,
etc.) and cause no other side effects, or it SHOULD execute logic with side effects, but SHOULD NOT do both.

The phrase "side effects" means execution of logic not directly related to declaring classes, functions, constants, etc., *merely from including the file*.

"Side effects" include but are not limited to: generating output, explicit use of `require` or `include`, connecting to external services, modifying ini settings, emitting errors or exceptions, modifying global or static variables, reading from or writing to a file, and so on.

The following is an example of a file with both declarations and side effects; i.e, an example of what to avoid:

~~~php
<?php
// side effect: change ini settings
ini_set('error_reporting', E_ALL);

// side effect: loads a file
include "file.php";

// side effect: generates output
echo "<html>\n";

// declaration
function foo() {
    // function body
}
~~~

The following example is of a file that contains declarations without side effects; i.e., an example of what to emulate:

~~~php
<?php
// declaration
function foo() {
    // function body
}

// conditional declaration is *not* a side effect
if (! function_exists('bar')) {
    function bar() {
        // function body
    }
}
~~~

### 2.5 Maximum Line Length

The key issue is readability. Aim for 132 characters if it is convinient, it is not recommended to use more than 180 characters.

The exception are string files in the /lang directory where lines `"id" => "value";` should have the value defined as a single string of any length, wrapped by quotes (no concatenation operators, no heredoc and no newdoc syntax). This helps to parse and process these string files without including them as a PHP code.

### 2.6 Wrapping

* **Lines** When wrapping a line, indent the follow-on line by 8 spaces rather than 4. For example:

	~~~php
	if (a_long_condition() &&
	        a_nother_long_condition()){
	    do_something();
	}
	~~~

	Using eight spaces makes it easier to spot the difference between wrapped lines and indented blocks.
	
	The example above is only an illustration; it is best practice to avoid wrapping lines in control structures. See below.
	
	If you have too many conditions in one control structure, try setting some variables before the start of the structure to improve readability.

	~~~php	
	$courseCategory = ($element['object']->isCourseItem() or $element['object']->isCategoryItem());
	$scaleValue = in_array($element['object']->gradeType, array(GRADE_TYPE_SCALE, GRADE_TYPE_VALUE));
	 
	if ($courseCategory and $scaleValue) {
	~~~

* **Arrays** Associative **arrays** are an exception to the rule about 8-space indent for follow-on lines. The correct layout is:

	~~~ php
	
	$plugininfo['preferences'][$plugin] = array(
	    'id'     => $plugin, 
	    'link'   => $pref_url, 
	    'string' => $modulenamestr
	);
	~~~

	Lining up the =>s is optional. Small arrays can be done on one line.

* **Functions** If you have many parameters, indent them in line with the first parameter:

	~~~php
	public function myFunction($param1, $param2, $param3, $param4
	                           $param5, $param6, $param7, $param8
	                           $param9, $param10){
	~~~


## 3. Namespace and Class Names

Each class MUST be declared in a single file by itself, and it MUST be in a namespace of at least one level: a top-level vendor.

Class and Namespace names MUST be declared in `PascalCase` or `UpperCamelCase`.

Code written MUST use formal namespaces.

For example:

~~~php
<?php

namespace Vendor\Model;

class Foo {
}
~~~

### 3.1. Folder and Filename Structures for Namespaces and Classes

A fully qualified class name has the following form:

~~~php
\<NamespaceName>\(\<SubNamespaceName>)*\<ClassName>
~~~

1. The fully qualified class name MUST have a top-level namespace name also known as a "vendor namespace".

2. The fully qualified class name MAY have one or more sub-namespace names.

3. The fully qualified class name MUST have a terminating class name.

4. Underscores have no special meaning in any portion of the fully qualified class name.

5. Alphabetic characters in the fully qualified class name MAY be any combination of lower case and upper case.

6. All class names MUST be referenced in a case-sensitive fashion. 


## 4. Class Constants, Properties, and Methods

The term "class" refers to all classes, interfaces, and traits.

### 4.1. Constants

Class constants MUST be declared in all upper case with underscore separators.
For example:

~~~php
<?php
namespace Vendor\Model;

class Foo {
    const VERSION = '1.0';
    const DATE_APPROVED = '2012-06-01';
}
~~~

### 4.2. Properties

Properties MUST be named as `lowerCamelCase` when public. If private or protected name MUST be prefixed with an underscore. 

The access modifier (`private`, `protected`, `public`) to a property MUST always be specified.

~~~ php

<?php

class Foo {
	// Private and protected variable
	private $_myPrivateVariable;
	
	// Public variables
	public $myPublicVariable;
}
~~~


### 4.3. Methods

Method names MUST be declared in `lowerCamelCase()`.

The access modifier (`private`, `protected`, `public`) to a method MUST always be specified.


## 5. Documentation and comments

Code documentation explains the code flow and the purpose of functions and variables. Use it whenever practical.

phpDocumentor 2 is a tool with which it is possible to generate documentation from your PHP source code. With this documentation you can provide your consumers with more information regarding the functionality embedded within your source and not only what is usable to them from your user interface.

Documentation generated by phpDocumentor 2 does not aim to be a replacement for conventional documentation but is rather supplemental, or reference, documentation.

PHPDoc has a number of tags that can be used in different places (files, classes and functions). You can refer full documentation at [PHPDoc] official documentation. We have some particular rules for using them that you MUST follow:

### Types

Some of the tags below (@param, @return...) do require the specification of a valid php type and a description. All these are allowed:

* PHP primitive types: int, bool, string...
* PHP complex types: array, stdClass (not Array, object).
* PHP classes:full or relative (to current namespace) class names.
true, false, null (always lowercase).
* static: for methods returning a new instance of the child/caller class.
* self: for methods returning a new instance of the parent/called class.
* $this: for methods returning the current instance of the class.
* void: for methods with a explicit empty "return" statement.
Also, there are some basic rules about how to use those types:

When multiple different types are possible, they must be separated by a vertical bar (pipe).

### Tags

@copyright

These include the year and copyright holder (creator) of the original file. Do not change these in existing files!

`@copyright 2008 Kim Bloggs`

@license

These must be GPL v3+ and use this format:

`@license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later`

@param

Don't put hyphens or anything fancy after the variable name, just a space.

`@param type $name Description.`

@return

The @return tag is mandatory if the function has a return statement, but can be left out if it does not have one.

The description portion is optional, it can be left out if the function is simple and already describes what is returned.

`@return type Description.`

@var

The @var tag is used to document class properties.

`@var type Description.`

@uses

If a function uses die or exit, please add this tag to the docblock to help developers know this function could terminate the page:

`@uses exit`

@access

The access can be used to specify access control for an element. Should only be used when the method definition does not already specify access control.

In the case of functions, specifying public access is redundant and so should be avoided.

`@access private`

@since

When adding a new classes or function to the core libraries (or adding a new method to an existing class), use a @since tag to document which version it was added in. For example:

`@since 2.1`

@see

If you want to refer the user to another related element (include, page, class, function, define, method, variable) then you can use @see.

`@see someOtherFunction()`

@deprecated (and @todo)

When deprecating an old API, use a @deprecated tag to document which version it was deprecated in, and add @todo and @see if possible. Make sure to mention relevant issues. For example:

~~~php
/**
 * ...
 * @deprecated since 2.0 #123 - please do not use this function any more.   
 * @todo #125 This will be deleted in 2.2.
 * @see myClass::myNewFunction()
 */
~~~

@throws

This tag is valid and can be used optionally to indicate the method or function will throw and exception. This is to help developers know they may have to handle the exceptions from such functions.

### Files Header

All files that contain PHP code should contain, without any blank line after the php open tag, a full GPL copyright statement at the top, plus a SEPARATE docblock right under it containing a:

short one-line description of the file
longer description of the file
@package tag (required)
@category tag (only when everything in the file is related to one of the Core APIs)
@copyright (required)
@license (required)

<?php
// This file is part of BoA - http://boa-project.org/
//
// BoA is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// BoA is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with BoA.  If not, see <http://www.gnu.org/licenses/>.
 
~~~php
/**
 * This is a one-line short description of the file/class.
 *
 * You can have a rather longer description of the file/class as well,
 * if you like, and it can span multiple lines.
 *
 * @package    myPlugin
 * @category   editor
 * @copyright  2016 BoA Project
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
~~~

### Properties

All properties should have a docblock with the following minimum information:

~~~php
class MyClass {
    /** @var string This variable does something */
    protected $something;
}
~~~

or

~~~php
class MyClass {
    /** 
     * This variable does something and has a very long description which can
     * wrap on multiple lines
     * @var string 
     */
    protected $something;
}
~~~

Even if there are several properties all sharing something in common, do not use DocBlock templates. Instead, document every property explicitly as in the following example:

~~~php
class Zebra {
    /** @var int The number of white stripes */
    protected $whiteStripes = 0;
 
    /** @var int The number of black stripes */
    protected $blackStripes = 0;
 
    /** @var int The number of red stripes */
    protected $redStripes = 0;
}
~~~

### Constants

Class constants should be documented in the following way:

~~~php
class Sam {
   /**
    * This is used when Sam is in a good mood.
    */
   const MOOD_GOOD = 0;
}
~~~

### Functions

All functions and methods should have a complete docblock like this:

~~~php
/**
 * The description should be first, with asterisks laid out exactly
 * like this example. If you want to refer to a another function,
 * use @see as below.   If it's useful to link to BoA
 * documentation on the web, you can use a @link below or also 
 * inline like this {@link https://docs.boa-project.org/dev/something}
 * Then, add descriptions for each parameter and the return value as follows.
 *
 * @see clean_param()
 * @param int   $postid The PHP type is followed by the variable name
 * @param array $scale The PHP type is followed by the variable name
 * @param array $ratings The PHP type is followed by the variable name
 * @return bool A status indicating success or failure
 */
~~~

You must include a description even if it appears to be obvious from the @param and/or @return lines.

An exception is made for overridden methods which make no change to the meaning of the parent method and maintain the same arguments/return values. In this case you should omit the comment completely. Use of the @inheritdoc or @see tags is explicitly forbidden as a replacement for any complete docblock.

### Defines

All defines should be documented in the following way:

~~~php
/**
 * PARAM_INT - integers only, use when expecting only numbers.
 */
define('PARAM_INT', 'int');
 
/**
 * PARAM_ALPHANUM - expected numbers and letters only.
 */
define('PARAM_ALPHANUM', 'alphanum');
~~~

### Inline comments

Inline comments must use the "// " (2 slashes + whitespace) style, laid out neatly so that it fits among the code and lines up with it. The first line of the comment must begin with a capital letter (or a digit, or '...') and the comment must end with a proper punctuation character. Permitted final characters are '.', '?' or '!'.

~~~php
function myFunction($postId, $scale, $ratings = null){
    if (!$ratings) {
        $ratings = array();     // Initialize the empty array.
        $rates = $DB->getRecords('forum_ratings', array('post' => $postid));
        // ... then process each rating in
        // turn.
        foreach ($rates as $rate) {
            doSomethingWith($rate);
        }
 
        // Do we need to tidy up?
        if (!empty($rates)){
            // 42 more things happen here!
            finshUp();
        }
~~~

If your comment is due to some issue, please feel free to include the correct issue number in your comment. This makes it easier to track down decisions and discussions about things.

Comments like below are considered BAD and should be avoided.

~~~php
/*  Comment explaining this piece of code. */
\# Comment explaining this piece of code. 
// comment explaining this piece of code (without capital letter and punctuation)
~~~


#6. Creating plugins
-------------------------------------------

Refer to [PLUGINS_ARCHITECTURE.MD] file to see how the plugins work and how you can create new plugins.

A plugin MUST be a self-contained folder named as [namespace]\.\[plugin_name] (all lowercase) which should include at least a manifest.xml file.



[RFC 2119]: http://www.ietf.org/rfc/rfc2119.txt
[PSR-0]: https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-0.md
[PSR-4]: https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-4-autoloader.md

[PLUGINS_ARCHITECTURE.MD]: PLUGINS_ARCHITECTURE.MD
[PHPDoc]: https://www.phpdoc.org/docs/latest/index.html
