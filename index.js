import x from '@xencelabs-quick-keys/node'
import http2 from 'http2'

const host = "https://xxxx/"
const token = "xxxx"
const eventName = "xence"

let session;

function initializeHASession() {
    session = http2.connect(host)

    session.on("close", () => {
        console.log('HA Session closed, connect again!')
        initializeHASession()
    })
    
    session.on("goaway", () => { console.log('Goaway!') })
    session.on("timeout", () => { console.log('Timeout!') })
    session.on("error", (e) => { console.log('Error!', e) })
    session.on("frameError", (e) => { console.log('Frame error!', e) })

    return session
}

function postHAEvent(state) {
    const req = session.request({
        ":path": "/api/events/" + eventName,
        ":method": "POST",
        "Authorization": "Bearer " + token,
        "content-type": "application/json"
    })

    req.on("data", chunk => { console.log(chunk.toString()) })

    req.on("error", (e) => { console.log('Error!', e) })

    req.end(JSON.stringify(state))
}

x.XencelabsQuickKeysManagerInstance.on('connect', async (myDevice) => {
    console.log("Connected to device")

    initializeHASession()

	await myDevice.startData()

    // Log errors
    myDevice.on('error', (error) => { console.error(error) })

    // Configure basic device things
    await myDevice.setSleepTimeout(5);
    await myDevice.setDisplayBrightness(x.XencelabsQuickKeysDisplayBrightness.Full)
    await myDevice.setDisplayOrientation(x.XencelabsQuickKeysDisplayOrientation.Rotate0)
    await myDevice.setWheelSpeed(x.XencelabsQuickKeysWheelSpeed.Normal)

    // Configure wheel color
    await myDevice.setWheelColor(255, 255, 0)

    // Set labels
    await myDevice.setKeyText(0, 'Biurko')
    await myDevice.setKeyText(1, 'Salon')
    await myDevice.setKeyText(2, 'Coś')
    await myDevice.setKeyText(3, 'four')
    await myDevice.setKeyText(4, 'one')
    await myDevice.setKeyText(5, 'two')
    await myDevice.setKeyText(6, 'three')
    await myDevice.setKeyText(7, 'four')

    // Log battery info
    myDevice.on('battery', (x) => { console.log(x) })

    // Handle click events (0-9) and wheel
	myDevice.on('down', (keyIndex) => {
		console.log('key %d down', keyIndex)
        postHAEvent({ type: 'button', action: 'down', index: keyIndex })
	})

	myDevice.on('up', (keyIndex) => {
		console.log('key %d up', keyIndex)
        postHAEvent({ type: 'button', action: 'up', index: keyIndex })

        //myDevice.showOverlayText(1, `Key ${keyIndex}!`)
	})

	myDevice.on('wheel', (e) => {
		console.log('wheel %s', e)
        postHAEvent({ type: 'wheel', action: e })
	})
})

x.XencelabsQuickKeysManagerInstance.on('disconnect', (myDevice) => {
    console.log("Disconnected from device")
})

// Prompt the user to grant access to some devices
x.XencelabsQuickKeysManagerInstance.scanDevices().catch((e) => {
	console.error(`Scan failed: ${e}`)
})
