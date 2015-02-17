#pragma strict

var scaleStep:float = 1.02;
var centerPosition:Vector3;
var startDeepObject:GameObject;
var keepLevels:int = 3;
var currentLevel:int = 0;

public class Support
{
	public static function removeFromArray(arr:Array, val)
	{
		var index = -1;
		for (var i = 0; i < arr.length; ++i)
	    	if(arr[i] == val) index = i;
	    
	    if(index != -1){
	    	arr.splice(index,1);
	    }
	}
}

public class DeepObject
{
    public var gameObject:GameObject;
    public var children = new Array();
    public static var allObjects = new Array();
    public var level:int;
    
    public function DeepObject(gO:GameObject, l:int)
    {
    	gameObject = gO;
    	level = l;
    	allObjects.push( this );
    }
    
    public function destroy()
    {
    	destroyChildren();
    	Support.removeFromArray(allObjects, this);
		gameObject.Destroy(gameObject);
    }
    
    public function destroySelf()
    {
    	Support.removeFromArray(allObjects, this);
		gameObject.Destroy(gameObject);
    }
    
    public function addChild(gO:DeepObject)
    {
    	children.push(gO);
    }
    
    public function destroyChildren()
    {
    	for (var i = 0; i < children.length; ++i)
    	{
    		var castChildObj:DeepObject = children[i] as DeepObject;
    		castChildObj.destroy();
    	}
    	children = new Array();
    	
    }
}

function Start()
{
    
    var child = Instantiate(startDeepObject, Vector3(0, 0, 0), Quaternion.identity);
	
	child.transform.parent = transform;
	
	DeepObject.allObjects.push( new DeepObject(child, 0) );
	
}

function Update()
{
	if (Input.GetKey(KeyCode.UpArrow))
    {
           zoomGame(scaleStep);
    }
    if (Input.GetKey(KeyCode.DownArrow))
    {
            zoomGame(1/scaleStep);
    }
    
    // check deep object levels
    var destroyObjects = new Array();
    var prevCurrentLevel = currentLevel;
    for(var i = 0; i < DeepObject.allObjects.length; ++i)
    {
    	var castObject:DeepObject = DeepObject.allObjects[i] as DeepObject;
    	
    	if(castObject.gameObject.activeSelf == true){
	    	// add children
	    	if(castObject.gameObject.transform.lossyScale.x > 1){
	    		splitDeepObject(castObject);
	    	}
    	}
    	
    	// remove children
    	// OPPOSITE OF SPLITTING CHILDREN
    	if(castObject.gameObject.transform.lossyScale.x < 1)
    	{
    		castObject.destroyChildren();
    		castObject.gameObject.SetActive(true);
    		
    		// set current level
    		// step up one level
			if(castObject.level < currentLevel){
				currentLevel = castObject.level;
			}
    	}
    	
    	// destroy roots
    	if(castObject.level <= (currentLevel-keepLevels)){
    		Debug.Log('destroy level '+castObject.level+' - currentLevel '+currentLevel);
    		destroyObjects.push(castObject);
    	}
    }
    
    // destroy roots
    for(var j = 0; j < destroyObjects.length; ++j)
    {
    	var castDestroyObj:DeepObject = destroyObjects[j] as DeepObject;
    	castDestroyObj.destroySelf();
    }
    
    // step up one level
    if(currentLevel < prevCurrentLevel)
    {
    	unSplitRootObjects();
    }
}

function zoomGame(scaleStep:float)
{
	this.transform.localScale *= scaleStep;
}

function unSplitRootObjects()
{
	Debug.Log('current level '+currentLevel+' - unsplit Level '+(currentLevel-keepLevels+1));
	
	for(var i = 0; i < DeepObject.allObjects.length; ++i)
    {
    	var castObj:DeepObject = DeepObject.allObjects[i] as DeepObject;
    	if(castObj.level == (currentLevel-keepLevels+1)){
    		// TODO REVERSE LEVEL
    	}	
    }
}

function splitDeepObject(obj:DeepObject)
{
	/**
	* CONVERT ALL CHILDREN INTO NEW PREFABS (DEEP GAME OBJECTS)
	*/
	var numChildren = obj.gameObject.transform.childCount;
    for (var i = 0; i < numChildren; ++i)
    {
    	var childTransform = obj.gameObject.transform.GetChild(i).transform;
    	
    	// TODO
    	// get prefab from component variable
    	// child.GetComponent.<LodObject>().setController(gameObject);
    	var childPrefab = Instantiate(startDeepObject, Vector3(childTransform.position.x, childTransform.position.y, childTransform.position.z), Quaternion.identity);
        
        childPrefab.transform.localScale = childTransform.localScale;
        childPrefab.transform.parent = transform;
        
        // add to array and parent obj
        var childObj = new DeepObject(childPrefab, obj.level+1);
    	obj.addChild( childObj );
	}
	
	// set current level
	if(obj.level >= currentLevel){
		currentLevel = obj.level + 1;
	}
	
	// remove deepObject from index
	// Support.removeFromArray(DeepObject.allObjects, obj);
	// Destroy(obj.gameObject);

	// hide object
	obj.gameObject.SetActive(false);
}