import * as React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  PanResponderInstance,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  TouchableHighlightBase
} from 'react-native';

export interface ZoomViewProps {
  data: { uri: string; id: number; };
  swipeTo: ( index: number ) => void;
  curIndex: number;
}

export interface ZoomViewState {
  zoomLevel: number;
  offset: { x: number; y: number; };
  status: ZoomViewStatus
}

/**
 * Constants
 */
const DOUBLE_TAP_DELAY = 300;
const MOVEMENT_THRESHOLD = 5;

enum ZoomViewStatus {
  NORMAL = "ZoomViewStatus/NORMAL",
  ZOOM = "ZoomViewStatus/ZOOM"
}

export default class ZoomViewComponent extends React.Component<ZoomViewProps, ZoomViewState> {
  gestureHandlers: PanResponderInstance;
  viewport: { width: number; height: number };
  timestamp: number;

  constructor ( props: ZoomViewProps ) {
    super( props );
    this.state = {
      zoomLevel: 1,
      offset: { x: 0, y: 0 },
      status: ZoomViewStatus.NORMAL
    };
    this.viewport = Dimensions.get( 'window' );
    this.timestamp = new Date().getTime();

    this.gestureHandlers = PanResponder.create( {
      onStartShouldSetPanResponder: ( e, gestureState ) => this._onStartShouldSetPanResponder( e, gestureState ),
      onMoveShouldSetPanResponder: ( e, gestureState ) => this._onMoveShouldSetPanResponder( e, gestureState ),
      onPanResponderGrant: undefined,
      onPanResponderMove: ( e, gestureState ) => this._onPanResponderMove( e, gestureState ),
      onPanResponderRelease: ( e, gestureState ) => this._onPanResponderRelease( e, gestureState ),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false
    } )
  }

  private _isDoubleTap ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const now = new Date().getTime();
    // NOTE : double tap condition == now - this.timestamp < tapDelay
    if ( e.timeStamp - this.timestamp < DOUBLE_TAP_DELAY )
      // fire double tap event
      this._onDoubleTap( e, gestureState );
    else this.timestamp = e.timeStamp;
  }

  private _onDoubleTap ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const { locationX, locationY } = e.nativeEvent;
    const { status } = this.state;

    switch ( status ) {
      case ZoomViewStatus.NORMAL:
        this._zoomToLocation( locationX, locationY, 1.3 );
        break;
      case ZoomViewStatus.ZOOM:
        // reset
        this.setState( {
          zoomLevel: 1,
          offset: { x: 0, y: 0 },
          status: ZoomViewStatus.NORMAL
        } );
        break;
    }

    console.log( "double tap!" );
  }

  private _onStartShouldSetPanResponder ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    this._isDoubleTap( e, gestureState );
    return true;
  }

  private _onMoveShouldSetPanResponder ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const { dx, dy, numberActiveTouches } = gestureState;
    return Math.abs( dx ) > MOVEMENT_THRESHOLD ||
      Math.abs( dy ) > MOVEMENT_THRESHOLD ||
      numberActiveTouches === 2;
  }

  private _onPanResponderMove ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    const { numberActiveTouches, dx } = gestureState;
    const { status } = this.state;
    const { swipeTo, curIndex } = this.props;
    switch ( status ) {
      case ZoomViewStatus.NORMAL: {
        // trigger swipe action
        if ( numberActiveTouches === 1 ) {
          if ( dx > 0 ) swipeTo( curIndex - 1 );
          else if ( dx < 0 ) swipeTo( curIndex + 1 );
        }
        /// trigger zoom action
        else if ( numberActiveTouches === 2 ) {
          console.log( "zoom" );
        }
      }
      case ZoomViewStatus.ZOOM: {

      }
    }
  }

  private _onPanResponderRelease ( e: GestureResponderEvent, gestureState: PanResponderGestureState ) {
    this._onPanResponderMove( e, gestureState );
  }

  private _zoomToLocation ( cx: number, cy: number, zl: number ) {
    // calculate offset
    const x = this.viewport.width / 2 - cx;
    const y = this.viewport.height / 2 - cy;

    this.setState( {
      zoomLevel: zl,
      offset: { x, y },
      status: ZoomViewStatus.ZOOM
    } )
  }

  public render () {
    const { zoomLevel, offset } = this.state;
    const { x, y } = offset;
    const { data } = this.props;
    const transformStyle = {
      transform: [
        { scale: zoomLevel },
        { scale: zoomLevel },
        { translateX: x },
        { translateY: y },
        { perspective: 1000 } ]
    };

    return (
      <View
        style={ [ { ...styles.container, ...this.viewport }, transformStyle ] }
        { ...this.gestureHandlers.panHandlers }>
        <View>

        </View>
        <Image
          source={ data }
          style={ styles.image }
          resizeMode="contain" />
      </View>
    );
  }
}

/**
 * Styles
 */

const styles = StyleSheet.create( {
  container: {
    flex: 1
  },
  image: {
    flex: 1,
    width: undefined,
    height: undefined
  }
} );